const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());


//MySQL adatbázis kapcsolat Sequalize ORM-el
const sequelize = new Sequelize('zeneiskola_orm', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});


//Bejelentkezés modell definiálása
const Bejelentkezes = sequelize.define('Bejelentkezes', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fnev: { type: DataTypes.STRING, allowNull: false },
    jelszo: { type: DataTypes.STRING, allowNull: false },
    jogosultsag: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false }
}, {
    timestamps: false,
    tableName: 'bejelentkezesek'
});


//Kategória modell definiálása
const Kategoria = sequelize.define('Kategoria', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    katNev: { type: DataTypes.STRING, allowNull: false }
}, {
    timestamps: false,
    tableName: 'kategoriak'
});


//Hangszer modell definiálása
const Hangszer = sequelize.define('Hangszer', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    katId: { type: DataTypes.INTEGER, allowNull: false },
    leltarId: { type: DataTypes.INTEGER, allowNull: false },
    nev: { type: DataTypes.STRING, allowNull: false }
}, {
    timestamps: false,
    tableName: 'hangszerek'
});


//Leltár modell definiálása
const Leltar = sequelize.define('Leltar', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ar: { type: DataTypes.INTEGER, allowNull: false },
    elerhetoseg: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
    timestamps: false,
    tableName: 'leltarak'
});


//Kölcsönzés modell definiálása
const Kolcsonzes = sequelize.define('Kolcsonzes', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    hangszerId: { type: DataTypes.INTEGER, allowNull: false },
    diakId: { type: DataTypes.INTEGER, allowNull: false },
    kolcsKezd: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    kolcsVeg: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isAfterStart(value) {
                if (value <= this.kolcsKezd) {
                    throw new Error('A kölcsönzés vége nem lehet korábbi vagy azonos a kezdettel');
                }
            }
        }
    },
    megjegyzes: { type: DataTypes.STRING, allowNull: true }
}, {
    timestamps: false,
    tableName: 'kolcsonzesek'
});


//Diák modell definiálása
const Diak = sequelize.define('Diak', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nev: { type: DataTypes.STRING, allowNull: false },
    telefonsz: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    szulDatum: { type: DataTypes.DATEONLY, allowNull: false },
    sajatHangszer: { type: DataTypes.STRING, allowNull: true }
}, {
    timestamps: false,
    tableName: 'diakok'
});


//Tanár modell definiálása
const Tanar = sequelize.define('Tanar', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nev: { type: DataTypes.STRING, allowNull: false },
    telefonsz: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false }
}, {
    timestamps: false,
    tableName: 'tanarok'
});


//KiMitTud modell definiálása
const KiMitTud = sequelize.define('KiMitTud', {
    tanarId: { type: DataTypes.INTEGER, allowNull: false },
    hangszerId: { type: DataTypes.INTEGER, allowNull: false }
}, {
    timestamps: false,
    tableName: 'kimittud'
});


//Ora modell definialasa
const Ora = sequelize.define('Ora', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tanarId: { type: DataTypes.INTEGER, allowNull: false },
    diakId: { type: DataTypes.INTEGER, allowNull: false },
    tema: { type: DataTypes.STRING, allowNull: false }
}, {
    timestamps: false,
    tableName: 'orak'
});


//Modell kapcsolatok definiálása

// Kategória.id  -  Hangszer.katId
Kategoria.hasMany(Hangszer, { foreignKey: 'katId' });
Hangszer.belongsTo(Kategoria, { foreignKey: 'katId' });

// Hangszer.id  -  Kolcsonzes.hangszerId
Hangszer.hasMany(Kolcsonzes, { foreignKey: 'hangszerId' });
Kolcsonzes.belongsTo(Hangszer, { foreignKey: 'hangszerId' });

// Leltar.id  -  Hangszer.leltarId
Leltar.hasOne(Hangszer, { foreignKey: 'leltarId' });
Hangszer.belongsTo(Leltar, { foreignKey: 'leltarId' });

// Hangszer.id  -  KiMitTud.hangszerId
Hangszer.belongsToMany(Tanar, {
    through: KiMitTud,
    foreignKey: 'hangszerId',
    otherKey: 'tanarId'
});

Tanar.belongsToMany(Hangszer, {
    through: KiMitTud,
    foreignKey: 'tanarId',
    otherKey: 'hangszerId'
});

// Diak.id  -  Kolcsonzes.diakId
Diak.hasMany(Kolcsonzes, { foreignKey: 'diakId' });
Kolcsonzes.belongsTo(Diak, { foreignKey: 'diakId' });

// Diak.id  -  Ora.diakId
Diak.hasMany(Ora, { foreignKey: 'diakId' });
Ora.belongsTo(Diak, { foreignKey: 'diakId' });

// Tanar.id  -  Ora.tanarId
Tanar.hasMany(Ora, { foreignKey: 'tanarId' });
Ora.belongsTo(Tanar, { foreignKey: 'tanarId' });




// Diák CRUD műveletek
//Diákok lekérdezése
app.get('/api/diakok', async (req, res) => {
    try {
        res.json(await Diak.findAll());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Diák lekérdezése id alapján
app.get('/api/diakok/:id', async (req, res) => {
    try {
        const diak = await Diak.findByPk(req.params.id);
        if (!diak) return res.status(404).json({ message: 'Nincs ilyen diák' });
        res.json(diak);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Diák felvitele
app.post('/api/diakok', async (req, res) => {
    try {
        res.json(await Diak.create(req.body));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//Diák módosítása
app.put('/api/diakok/:id', async (req, res) => {
    try {
        const diak = await Diak.findByPk(req.params.id);
        if (!diak) return res.status(404).json({ message: 'Nincs ilyen diák' });
        await diak.update(req.body);
        res.json(diak);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//Diák törlése
app.delete('/api/diakok/:id', async (req, res) => {
    try {
        const diak = await Diak.findByPk(req.params.id);
        if (!diak) return res.status(404).json({ message: 'Nincs ilyen diák' });
        await diak.destroy();
        res.json({ message: 'Diák törölve' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});




// Tanár CRUD műveletek
//Tanárok lekérdezése
app.get('/api/tanarok', async (req, res) => {
    try {
        res.json(await Tanar.findAll());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Tanárok lekérdezése id alapján
app.get('/api/tanarok/:id', async (req, res) => {
    try {
        const tanar = await Tanar.findByPk(req.params.id);
        if (!tanar) return res.status(404).json({ message: 'Nincs ilyen tanár' });
        res.json(tanar);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Tanár felvitele
app.post('/api/tanarok', async (req, res) => {
    try {
        res.json(await Tanar.create(req.body));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//Tanár módosítása
app.put('/api/tanarok/:id', async (req, res) => {
    try {
        const tanar = await Tanar.findByPk(req.params.id);
        if (!tanar) return res.status(404).json({ message: 'Nincs ilyen tanár' });
        await tanar.update(req.body);
        res.json(tanar);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//Tanár törlése
app.delete('/api/tanarok/:id', async (req, res) => {
    try {
        const tanar = await Tanar.findByPk(req.params.id);
        if (!tanar) return res.status(404).json({ message: 'Nincs ilyen tanár' });
        await tanar.destroy();
        res.json({ message: 'Tanár törölve' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});




// Hangszer CRUD műveletek
//Hangszerek lekérdezése
app.get('/api/hangszerek', async (req, res) => {
    try {
        res.json(await Hangszer.findAll());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Hangszerek lekérdezése id alapján
app.get('/api/hangszerek/:id', async (req, res) => {
    try {
        const hangszer = await Hangszer.findByPk(req.params.id);
        if (!hangszer) return res.status(404).json({ message: 'Nincs ilyen hangszer' });
        res.json(hangszer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Hangszer felvitele
app.post('/api/hangszerek', async (req, res) => {
    try {
        res.json(await Hangszer.create(req.body));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//Hangszer módosítása
app.put('/api/hangszerek/:id', async (req, res) => {
    try {
        const hangszer = await Hangszer.findByPk(req.params.id);
        if (!hangszer) return res.status(404).json({ message: 'Nincs ilyen hangszer' });
        await hangszer.update(req.body);
        res.json(hangszer);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//Hangszer törlése
app.delete('/api/hangszerek/:id', async (req, res) => {
    try {
        const hangszer = await Hangszer.findByPk(req.params.id);
        if (!hangszer) return res.status(404).json({ message: 'Nincs ilyen hangszer' });
        await hangszer.destroy();
        res.json({ message: 'Hangszer törölve' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});





// Kategória CRUD műveletek
//Kategóriák lekérdezése
app.get('/api/kategoriak', async (req, res) => {
    try {
        res.json(await Kategoria.findAll());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Kategória lekérdezése id alapján
app.get('/api/kategoriak/:id', async (req, res) => {
    try {
        const kat = await Kategoria.findByPk(req.params.id);
        if (!kat) return res.status(404).json({ message: 'Nincs ilyen kategória' });
        res.json(kat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Kategória felvitele
app.post('/api/kategoriak', async (req, res) => {
    try {
        res.json(await Kategoria.create(req.body));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//Kategória módosítása
app.put('/api/kategoriak/:id', async (req, res) => {
    try {
        const kat = await Kategoria.findByPk(req.params.id);
        if (!kat) return res.status(404).json({ message: 'Nincs ilyen kategória' });
        await kat.update(req.body);
        res.json(kat);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//kategória törlése
app.delete('/api/kategoriak/:id', async (req, res) => {
    try {
        const kat = await Kategoria.findByPk(req.params.id);
        if (!kat) return res.status(404).json({ message: 'Nincs ilyen kategória' });
        await kat.destroy();
        res.json({ message: 'Kategória törölve' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});




// Leltár CRUD műveletek
//Leltár lekérdezése
app.get('/api/leltarak', async (req, res) => {
    try {
        res.json(await Leltar.findAll());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Leltár lekérdezése id alapján
app.get('/api/leltarak/:id', async (req, res) => {
    try {
        const leltar = await Leltar.findByPk(req.params.id);
        if (!leltar) return res.status(404).json({ message: 'Nincs ilyen leltár' });
        res.json(leltar);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Leltár felvitele
app.post('/api/leltarak', async (req, res) => {
    try {
        res.json(await Leltar.create(req.body));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//Leltár módosítása
app.put('/api/leltarak/:id', async (req, res) => {
    try {
        const leltar = await Leltar.findByPk(req.params.id);
        if (!leltar) return res.status(404).json({ message: 'Nincs ilyen leltár' });
        await leltar.update(req.body);
        res.json(leltar);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//Leltár törlése
app.delete('/api/leltarak/:id', async (req, res) => {
    try {
        const leltar = await Leltar.findByPk(req.params.id);
        if (!leltar) return res.status(404).json({ message: 'Nincs ilyen leltár' });
        await leltar.destroy();
        res.json({ message: 'Leltár törölve' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});




// Óra CRUD műveletek
//Óra lekérdezése
app.get('/api/orak', async (req, res) => {
    try {
        res.json(await Ora.findAll());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Óra lekérdezése id alapján
app.get('/api/orak/:id', async (req, res) => {
    try {
        const ora = await Ora.findByPk(req.params.id);
        if (!ora) return res.status(404).json({ message: 'Nincs ilyen óra' });
        res.json(ora);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Óra felvitele
app.post('/api/orak', async (req, res) => {
    try {
        res.json(await Ora.create(req.body));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//Óra módosítása
app.put('/api/orak/:id', async (req, res) => {
    try {
        const ora = await Ora.findByPk(req.params.id);
        if (!ora) return res.status(404).json({ message: 'Nincs ilyen óra' });
        await ora.update(req.body);
        res.json(ora);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//Óra törlése
app.delete('/api/orak/:id', async (req, res) => {
    try {
        const ora = await Ora.findByPk(req.params.id);
        if (!ora) return res.status(404).json({ message: 'Nincs ilyen óra' });
        await ora.destroy();
        res.json({ message: 'Óra törölve' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


//Szerver indítása
sequelize.sync()
    .then(() => {
        console.log('Adatbázis szinkronizálva');
        app.listen(PORT, () => {
            console.log(`Szerver fut: http://localhost:${PORT}`);
        });
    })
    .catch(err => console.error('DB hiba:', err));
