require('dotenv').config();
const app = require('./app');
const { connect: connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Kết nối DB rồi mới chạy server
connectDB().then(() => {
    app.listen(PORT, HOST, () => {
        console.log(`✅ Server is running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    });
}).catch(error => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
});