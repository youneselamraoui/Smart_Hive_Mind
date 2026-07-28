import numpy as np
import pandas as pd
from faker import Faker
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib

fake = Faker("fr_FR")
N = 500
RANDOM_SEED = 42

np.random.seed(RANDOM_SEED)


def generate_label(competences, experience, note_profil, missions):
    base = (
        0.30 * (competences / 20)
        + 0.25 * (experience / 30)
        + 0.25 * (note_profil / 5)
        + 0.20 * (missions / 50)
    )
    noise = np.random.uniform(-0.20, 0.20)
    prob = np.clip(base + noise, 0, 1)
    return 1 if np.random.random() < prob else 0


rows = []
for _ in range(N):
    competences = np.random.randint(0, 21)
    experience = np.random.exponential(scale=5)
    experience = min(int(experience), 30)
    note_profil = round(np.random.uniform(1.0, 5.0), 2)
    missions = np.random.poisson(lam=8)
    missions = min(missions, 50)
    label = generate_label(competences, experience, note_profil, missions)
    rows.append(
        {
            "nbCompetencesMatchees": competences,
            "nbAnneesExperience": experience,
            "noteProfilMoyenne": note_profil,
            "nbMissionsRealisees": missions,
            "label": label,
        }
    )

df = pd.DataFrame(rows)

X = df[["nbCompetencesMatchees", "nbAnneesExperience", "noteProfilMoyenne", "nbMissionsRealisees"]]
y = df["label"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=RANDOM_SEED
)

model = GradientBoostingClassifier(
    n_estimators=100, max_depth=3, random_state=RANDOM_SEED
)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=["echec", "reussite"]))

joblib.dump(model, "src/model.joblib")
print("\nModel saved to src/model.joblib")
