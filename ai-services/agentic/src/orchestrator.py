import os
import logging

import httpx

BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:3000")
INTERNAL_SERVICE_KEY = os.getenv("INTERNAL_SERVICE_KEY", "")
STEP_TIMEOUT = 30.0

logger = logging.getLogger("agentic")


class StepError(Exception):
    def __init__(self, step_index: int, label: str, reason: str):
        self.step_index = step_index
        self.label = label
        self.reason = reason
        super().__init__(f"Step {step_index} ({label}) failed: {reason}")


class AtelierOrchestrator:
    def __init__(self, atelier_id: str):
        self.atelier_id = atelier_id

    async def run_workshop(self, steps: list[dict]) -> dict:
        total = len(steps)
        log_entries = []
        statut_final = "termine"
        raison = None
        steps_reussies = 0

        async with httpx.AsyncClient(timeout=STEP_TIMEOUT) as client:
            for index, step in enumerate(steps):
                label = step.get("label", f"etape_{index}")
                url = step.get("url", "")
                method = step.get("method", "POST").upper()
                payload = step.get("payload", {})

                def fail(reason_: str):
                    nonlocal statut_final, raison, steps_reussies  # type: ignore[misc]
                    statut_final = "echec"
                    raison = reason_
                    steps_reussies = index

                try:
                    logger.info("Step %d/%d: %s  -> %s %s", index + 1, total, label, method, url)

                    if method == "GET":
                        resp = await client.get(url, params=payload)
                    elif method == "POST":
                        resp = await client.post(url, json=payload)
                    elif method == "PUT":
                        resp = await client.put(url, json=payload)
                    elif method == "DELETE":
                        resp = await client.delete(url, params=payload)
                    else:
                        raise StepError(index, label, f"Unsupported HTTP method: {method}")

                    if resp.is_error:
                        detail = resp.text[:500]
                        raise StepError(index, label, f"HTTP {resp.status_code}: {detail}")

                    result = resp.json() if resp.text else {}

                    await self._report_progress(client, {
                        "index": index,
                        "label": label,
                        "statut": "termine",
                        "resultatUrl": result.get("resultatUrl", ""),
                    })

                    log_entries.append({"index": index, "label": label, "statut": "termine", "detail": None})

                except StepError as exc:
                    fail(exc.reason)
                    await self._report_progress(client, {
                        "index": index, "label": label, "statut": "echec", "resultatUrl": "",
                    })
                    log_entries.append({"index": index, "label": label, "statut": "echec", "detail": exc.reason})
                    break

                except httpx.TimeoutException:
                    msg = f"TimeOut apres {STEP_TIMEOUT}s"
                    fail(msg)
                    await self._report_progress(client, {
                        "index": index, "label": label, "statut": "echec", "resultatUrl": "",
                    })
                    log_entries.append({"index": index, "label": label, "statut": "echec", "detail": msg})
                    break

                except Exception as exc:
                    msg = f"Exception: {str(exc)}"
                    logger.exception("Step %d crashed", index)
                    fail(msg)
                    await self._report_progress(client, {
                        "index": index, "label": label, "statut": "echec", "resultatUrl": "",
                    })
                    log_entries.append({"index": index, "label": label, "statut": "echec", "detail": msg})
                    break

                steps_reussies = index + 1

            await self._finalize(client, statut_final, log_entries)

        return {
            "atelierId": self.atelier_id,
            "statutGlobal": statut_final,
            "stepsReussies": steps_reussies,
            "stepsTotal": total,
            "raison": raison,
        }

    def _headers(self):
        return {"X-Internal-Key": INTERNAL_SERVICE_KEY}

    async def _report_progress(self, client: httpx.AsyncClient, etape: dict):
        url = f"{BACKEND_URL}/api/smart-tools/ateliers/{self.atelier_id}/progress"
        try:
            await client.post(url, json={"etape": etape}, headers=self._headers())
        except Exception:
            logger.warning("Progress callback failed for step %d", etape.get("index", -1))

    async def _finalize(self, client: httpx.AsyncClient, statut: str, log: list):
        url = f"{BACKEND_URL}/api/smart-tools/ateliers/{self.atelier_id}/finalize"
        try:
            await client.post(url, json={"statutGlobal": statut, "log": log}, headers=self._headers())
        except Exception:
            logger.warning("Finalize callback failed")
