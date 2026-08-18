const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middlewares/verifyToken');
const initialUsers = require('../fixtures/users.json');

// ⚠️ 寫作業前先 `npm start` 打開 http://localhost:3000/docs 看 Swagger UI 的完整規格。
// 💡 /* 作答區 ... */ 是答題提示區，取消註解後填入你的程式碼。

// ───────────────────────────────────────────────────────────
// state（module 層級、這個 router 獨用）
// ───────────────────────────────────────────────────────────
// 複製 initialUsers，不改外部陣列。
// 預填管理員：{ id: 1, email: 'leo@gym.com', password: <bcrypt hash of '1q2w3e4r'> }
const users = [...initialUsers];
let nextId = initialUsers.length + 1;

const router = express.Router();

// ───────────────────────────────────────────────────────────
// TODO 任務二：POST /register
// ───────────────────────────────────────────────────────────

// POST /register
// - 輸入：body = { email, password }
// - 輸出：201 + { status: 'success', message: '註冊成功' }，或 400 + { status: 'false', message: '...' }
// - 提示：
//   1. email、password 缺少任何一個欄位，或 email 已存在（使用陣列方法檢查）→ return 400 跟對應輸出訊息
//   2. 密碼加密可使用 bcrypt 的 genSalt 與 hash 
//   3. 加密完成後，將新使用者（包含 id、email、加密後 password）存進 users，並 return 201 跟對應輸出訊息
// - 注意：handler 是 async function
/* 作答區
router.METHOD('PATH', async (req, res) => { ... });
*/
router.post('/register', async (req, res) =>{
    try {
        const { email, password } = req.body;

        // 1-1 檢查是否缺少欄位
        if (!email || !password){
            return res.status(400).json({
                status: 'false',
                message: '請填寫完整的 email 和 password'
            });
        }

        // 1-2 檢查email 是否已存在
        const isExist = users.some(user => user.email === email);
        if(isExist){
            return res.status(400).json({
                status: 'false',
                message: '該 email 已被註冊'
            });
        }

        // 2. 密碼加密(使用bcrypt)
          // 2-1 生成一個強度為 10 的隨機值(salt)
        const salt = await bcrypt.genSalt(10);

          // 2-1 把使用者的「密碼」跟 salt 攪拌在一起，攪碎成無法還原的雜湊值（Hash）
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3-1 存進users 陣列並更新下一個 id
        const newUser = {
            id: nextId++,
            email: email,
            password: hashedPassword
        };
        users.push(newUser);

        // 3-2 回傳成功訊息
        return res.status(201).json({
            status: 'success',
            message: '註冊成功'
        });
    } catch (error) {
        return res.status(500).json({
            status: 'false',
            message: '伺服器錯誤'
        });
    }
});

// ───────────────────────────────────────────────────────────
// TODO 任務三：POST /login
// ───────────────────────────────────────────────────────────

// POST /login
// - 輸入：body = { email, password }
// - 輸出：200 + { status: 'success', token }，或 401 + { status: 'false', message: '帳號或密碼錯誤' }
// - 提示：
//   1. 從 users 找出 email 符合的使用者，如果找不到 → return 401 跟對應輸出訊息
//   2. 用 bcrypt.compare 比對密碼，如果不符合 → return 401 跟對應輸出訊息（兩種失敗回覆同樣訊息，避免帳號探測）
//   3. 用 jwt.sign 簽出 token，payload 帶入使用者的 id 和 email，secret 使用 process.env.JWT_SECRET，有效期設為 30 天
//   4. token 簽出後，回應 200 跟對應輸出訊息
// - 注意：handler 是 async function
/* 作答區
router.METHOD('PATH', async (req, res) => { ... });
*/
router.post('/login', async(req, res) => {
    try {
        const {email, password } = req.body;

        // 1. 從 users 找出 email 符合的使用者
        const user = users.find(u => u.email === email);

          // 如果找不到 → return 401 跟對應輸出訊息
        if(!user) {
            return res.status(401).json({
                status: 'false',
                message: '帳號或密碼錯誤'
            });
        }

        // 2. 用 bcrypt.compare 比對密碼
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

          // 如果不符合 → return 401 跟對應輸出訊息
        if (!isPasswordCorrect){
            return res.status(401).json({
                stasus: 'false',
                message: '帳號或密碼錯誤'
            });
        }

        // 3. 用 jwt.sign 簽出 token
        const token = jwt.sign(
            // payload 帶入使用者的 id 和 email，secret 使用 process.env.JWT_SECRET，有效期設為 30 天
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '30d'}
        );

        // 4. token 簽出後，回應 200 跟對應輸出訊息
        return res.status(200).json({
            status: 'success',
            token: token
        });
    } catch(error) {
        return res.status(500).json({
            status: 'false',
            message: '伺服器錯誤'
        });
    }
});

// ───────────────────────────────────────────────────────────
// TODO 任務四：GET /me（受保護）
// ───────────────────────────────────────────────────────────

// GET /me
// - 保護：路由第二個參數掛上 verifyToken 守門員（驗過後會將使用者資料掛到 req.user）
// - 輸出：200 + { status: 'success', user: ... }
/* 作答區
router.METHOD('PATH', middleware, (req, res) => { ... });
*/

// 路由第二個參數掛上 verifyToken 守門員
router.get('/me', verifyToken, (req, res) => {
    // 驗證成功後，verifyToken 後會將使用者資料掛到 req.user
    return res.status(200).json({
        status: 'success',
        user: req.user
    });
});

module.exports = router;
