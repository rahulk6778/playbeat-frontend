const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
});
const upload = multer({ storage });

const DB_FILE = path.join(__dirname, 'products.json');

const SUPPORTED_PAYMENT_METHODS = [
    {
        id: 'easypaisa',
        label: 'Easypaisa Wallet',
        description: 'Send payment to Easypaisa wallet +92 339 0005715',
        type: 'wallet',
        currency: 'PKR'
    },
    {
        id: 'jazzcash',
        label: 'JazzCash Wallet',
        description: 'Send payment to JazzCash wallet 0331 8333368',
        type: 'wallet',
        currency: 'PKR'
    },
    {
        id: 'bank_transfer',
        label: 'Bank Transfer',
        description: 'Transfer payment to your bank account and add transaction reference',
        type: 'bank',
        currency: 'PKR'
    },
    {
        id: 'card',
        label: 'Credit / Debit Card',
        description: 'Pay instantly with Visa, MasterCard or debit card',
        type: 'card',
        currency: 'PKR'
    }
];

function normalizeDb(db) {
    if (!db.products) db.products = [];
    if (!db.orders) db.orders = [];
    if (!db.payments) db.payments = [];
    if (!db.users) db.users = [];
    if (!db.carts) db.carts = [];
    if (!db.wishlists) db.wishlists = [];

    if (!db.settings) {
        db.settings = {
            adminPasswordHash: hashPassword('playbeat123'),
            adminEmail: 'admin@playbeat.digital',
            storeName: 'PlayBeat Digital',
            currency: 'PKR',
            paymentGateways: {
                easypaisa: { wallet: '+92 339 0005715', instructions: 'Use Easypaisa wallet and send payment to this number.' },
                jazzcash: { wallet: '0331 8333368', instructions: 'Use JazzCash wallet and send payment to this number.' },
                bank_transfer: { bankName: 'UBL', accountNumber: '1234567890123', accountTitle: 'PlayBeat Digital', instructions: 'Transfer the amount and add the reference code.' },
                card: { instructions: 'Pay with Visa or MasterCard in PKR.' }
            }
        };
    }

    if (!db.settings.homepageSections) {
        db.settings.homepageSections = [
            {
                id: 'home',
                title: 'Featured Products',
                emoji: '✨',
                backgroundImage: null,
                sections: ['home'],
                categories: ['Games', 'Gift Cards', 'Software', 'AI Tools', 'Game Items', 'Accounts', 'Subscriptions', 'Top Up'],
                subsections: []
            },
            {
                id: 'trending',
                title: 'Trending Now',
                emoji: '🔥',
                backgroundImage: null,
                sections: ['trending'],
                categories: [],
                subsections: []
            },
            {
                id: 'global',
                title: 'Global Selection',
                emoji: '🌍',
                backgroundImage: null,
                sections: ['global'],
                categories: [],
                subsections: []
            },
            {
                id: 'marketplace',
                title: 'Live Marketplace',
                emoji: '⚡',
                backgroundImage: null,
                sections: ['marketplace'],
                categories: ['Games', 'Gift Cards', 'Software', 'AI Tools', 'Game Items', 'Accounts', 'Subscriptions', 'Top Up', 'Trending', 'Global'],
                subsections: []
            }
        ];
    }

    return db;
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function findUserByEmail(db, email) {
    if (!email) return null;
    return db.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
}

function initDatabase() {
    if (!fs.existsSync(DB_FILE)) {
        const defaultData = normalizeDb({
            products: [
                {
                    id: '1',
                    name: 'Premium Gaming Pass',
                    category: 'Subscriptions',
                    type: 'Monthly',
                    price: 9.99,
                    sellingPrice: 9.99,
                    buyingPrice: 5.00,
                    originalPrice: 14.99,
                    discount: 33,
                    amount: 'Unlimited Access',
                    expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    offer: 'First month 50% off',
                    section: 'home',
                    image: null,
                    categoryImage: null,
                    promotion: 'Launch Special',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: '2',
                    name: 'Instant Game Boost',
                    category: 'Games',
                    type: 'One-time',
                    price: 4.99,
                    sellingPrice: 4.99,
                    buyingPrice: 2.00,
                    originalPrice: 7.99,
                    discount: 37,
                    amount: '1000 Coins',
                    expiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                    offer: 'Double coins this week',
                    section: 'trending',
                    image: null,
                    categoryImage: null,
                    promotion: 'Flash Sale',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: '3',
                    name: 'Professional Software Suite',
                    category: 'Software',
                    type: 'Lifetime',
                    price: 49.99,
                    sellingPrice: 49.99,
                    buyingPrice: 20.00,
                    originalPrice: 99.99,
                    discount: 50,
                    amount: 'Full Version',
                    expiry: null,
                    offer: 'Lifetime updates included',
                    section: 'global',
                    image: null,
                    categoryImage: null,
                    promotion: 'Early Bird',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: '4',
                    name: 'Rare Item Bundle',
                    category: 'Game Items',
                    type: 'Limited',
                    price: 19.99,
                    sellingPrice: 19.99,
                    buyingPrice: 8.00,
                    originalPrice: null,
                    discount: 0,
                    amount: '5 Legendary Items',
                    expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    offer: 'Limited stock available',
                    section: 'marketplace',
                    image: null,
                    categoryImage: null,
                    promotion: 'Exclusive Drop',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ],
            orders: []
        });

        fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
    } else {
        const existing = JSON.parse(fs.readFileSync(DB_FILE, 'utf8') || '{}');
        fs.writeFileSync(DB_FILE, JSON.stringify(normalizeDb(existing), null, 2));
    }
}

function readDatabase() {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const db = JSON.parse(data || '{}');
    return normalizeDb(db);
}

function writeDatabase(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(normalizeDb(data), null, 2));
}

function buildPaymentRecord(details, orderId) {
    const reference = details.transactionId || details.bankReference || null;
    const walletNumber = details.walletNumber || null;
    const cardNumber = details.cardNumber || null;
    const cardLast4 = cardNumber ? cardNumber.replace(/\D/g, '').slice(-4) : null;
    return {
        id: Date.now().toString(),
        orderId,
        paymentMethod: details.paymentMethod,
        walletNumber,
        bankName: details.bankName || null,
        bankReference: details.bankReference || reference,
        transactionId: reference,
        cardLast4,
        cardBrand: details.cardBrand || null,
        amount: parseFloat(details.totalAmount || 0),
        currency: 'PKR',
        status: details.status,
        customerName: details.customerName || null,
        email: details.email || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        rawDetails: {
            cardHolder: details.cardHolder || null,
            cardExpiry: details.cardExpiry || null,
            cardType: details.cardType || null,
            notes: details.orderNotes || null
        }
    };
}

function calculateProfit(product) {
    const sell = parseFloat(product.sellingPrice || product.price || 0);
    const buy = parseFloat(product.buyingPrice || 0);
    return sell - buy;
}

function calculateNetProfit(product) {
    const gross = calculateProfit(product);
    const overhead = parseFloat(product.sellingPrice || product.price || 0) * 0.2;
    return gross - overhead;
}

function parseFilterValues(param) {
    if (!param) return [];
    if (Array.isArray(param)) return param.flatMap(value => parseFilterValues(value));
    return String(param)
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
}

function filterProducts(products, values, field) {
    if (!values.length) return products;
    const normalized = values.map(value => value.toLowerCase());
    return products.filter(product => normalized.includes(String(product[field] || '').toLowerCase()));
}

// (server.js continues exactly as in workspace)

