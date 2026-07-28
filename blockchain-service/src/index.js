require("dotenv").config();
const app = require("./server");

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Blockchain service listening on port ${PORT}`);
});
