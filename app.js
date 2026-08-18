const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const authRouter = require('./routes/auth');
const swaggerDoc = require('./fixtures/swagger.json');

const app = express();

// ───────────────────────────────────────────────────────────
// TODO 任務五：將 middleware、router、守門員依序掛上 app
// ───────────────────────────────────────────────────────────
// 1. cors()
app.use(cors());

// 2. express.json()
app.use(express.json());

// 3. Swagger UI /docs（已預先提供如下，同學不需調整）
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// 4. /auth router
app.use('/auth', authRouter);

// 5. 404 守門員（無此路由資訊）
app.use((req, res, next) => {
    return res.status(404).json({
        status: 'false',
        message: '無此路由資訊'
    });
});

// 6. 錯誤處理守門員（⚠️ 4 個參數、最後一個）
//    回傳 status 500，body 包含兩個欄位：
//    - err：錯誤的類別名稱（例如 'SyntaxError'）
//    - message：錯誤訊息
app.use((err, req, res, next) => {
    return res.status(500).json({
        err: err.name,  
        message: err.message  
    });
});

// ⚠️ **最後不需呼叫 app.listen()** — 這個部分交由 server.js 負責（分離「組裝」跟「啟動」，這樣 test.js 可以 supertest 直接戳 app、不佔 port）。

module.exports = app;
