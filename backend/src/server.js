const app = require("./app");

const PORT = 8000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
