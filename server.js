const dotenv = require('dotenv');

const app = require('./app');

const PORT= process.env.PORT || 5001;

dotenv.config();

app.listen(PORT, () => {
  console.log(`Server is running on localshot:${PORT}`);
});
