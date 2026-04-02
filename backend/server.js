require('dotenv').config();
const app = require('./app');
const { connect: connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Kết nối DB rồi mới chạy server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
});