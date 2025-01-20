const express=require('express')
const session=require('express-session')
const moment=require('moment-timezone') //CommonJS

const app=express();

app.use(session({
    secret: 'p3-ZAZP#Soundwave-sessionespersistentes', //Secreto para firmar la cookie de sesión
    resave: false,              //No resguardar la sesión si no ha sido modificada
    saveUninitialized: true,    //Guarda la sesión aunque no haya sido inicializada
    //cookie: {secure: false}     //Usar secure: true sólo si usas HTTPS
    cookie: { secure: false, maxAge: 24 * 60 * 60 *1000 }
}));

//Middleware para mostrar detalles de la sesión
app.use((req, res, next)=>{
    if(req.session) {
        if (!req.session.createAt) {
            req.session.createAt = new Date().toISOString(); //Asignamos la fecha de creación de la sesión
        }
        req.session.lastAccess = new Date().toISOString(); //Asignamos la última vez que se accedió a la sesión
    }
    next();
});

//Ruta para mostrar la información de la sesión
app.get('/session', (req, res) => {
    if(req.session && req.session.isLoggedIn) {
        const sessionId = req.session.id;
        const createAt = new Date(req.session.createAt);
        const lastAccess = new Date(req.session.lastAccess);
        const sessionDuration = Math.floor((new Date() - createAt) / 1000); //Duración de la sesión en segundos

        res.send(`
            <body style="background-color:#f0fdfa">
            <center>
            <h1><font color="#0e7490">Detalles de la sesión</font></h1>
            <p><font color="#c084fc"><strong>ID de la sesión:</strong></font> <font color="#60a5fa">${sessionId}</font></p>
            <p><font color="#c084fc"><strong>Fecha de creación de la sesión:</strong></font> <font color="#60a5fa">${createAt}</font></p>
            <p><font color="#c084fc"><strong>Último acceso:</strong></font> <font color="#60a5fa">${lastAccess}</font></p>
            <p><font color="#c084fc"><strong>Duración de la sesión (en segundos):</strong></font> <font color="#60a5fa">${sessionDuration}</font></p>
            <br>
            <a href=/status style="text-decoration: none">Estado de la sesión activa</a>
            <br>
            <a href=/update style="text-decoration: none">Actualizar sesión activa</a>
            <br>
            <a href=/logout>Cerrar sesión</a>
            </center>
            </body>
            `)
    } else {
        res.send(`<body style="background-color:#f0fdfa">
            <center>
            <h1><font color="#f472b6">No hay sesión activa.</font></h1>
            </center>
            </body>
            `);
    }
})


//Ruta para cerrar la sesión
app.get('/logout', (req, res)=> {
    req.session.destroy((err) => {
        if(err) {
            return res.send('Error al cerrar la sesión.');
        } 
        res.send(`
            <body style="background-color:#f0fdfa">
            <center>
            <h1><font color="#65a30d">Sesión cerrada exitosamente.</font></h1>
            </center>
            </body>
            `);
    })
})


//Ruta para iniciar sesión
app.get('/login/:user/:psswd', (req, res) => {
    const usr = req.params.user;
    const pswd = req.params.psswd;
    if (!req.session.isLoggedIn) {
        req.session.usr = usr;
        req.session.pswd = pswd;
        req.session.isLoggedIn = true;
        req.session.createAt = new Date().toISOString();
        res.send(`<body style="background-color:#f0fdfa">
            <center>
            <h1><font color="#f472b6">Bienvenido(a),</font> <font color="#6366f1">${usr}</font></h1>
            <p><font color="#2dd4bf">Has iniciado sesión exitosamente.</font></p>
            <p><font color="#65a30d">¿Quieres ver los datos de tu sesión activa?</font></p>
            <a href=/session style="text-decoration: none">Sesión activa</a>
            <br>
            <a href=/update style="text-decoration: none">Actualizar sesión</a>
            </center>
            </body>
            `);
    } else {
        res.send(`
            <body style="background-color:#f0fdfa">
            <center>
            <h1><font color="#f472b6">Hola,</font> <font color="purple">${usr}</font></h1>
            <p><font color="#2dd4bf">Ya has iniciado sesión anteriormente.</font></p>
            <p><font color="#65a30d">¿Quieres ver los datos de tu sesión activa?</font></p>
            <a href=/session style="text-decoration: none">Sesión activa</a>
            <br>
            <a href=/update style="text-decoration: none">Actualizar sesión</a>
            </center>
            </body>
            `);
    }
});


//Ruta para actualizar la fecha de última consulta
app.get('/update', (req, res) => {
    if(req.session.isLoggedIn) {
        req.session.lastAccess = new Date();
        res.send(`
            <body style="background-color:#f0fdfa">
            <center>
            <h1><font color="#f472b6">La fecha de último acceso ha sido actualizada</font></h1>
            <a href=/session style="text-decoration: none">Sesión activa</a>
            <br>
            <a href=/status style="text-decoration: none">Estado de la sesión activa</a>
            </center>
            </body>
            `)
    } else {
        res.send(`
            <body style="background-color:#f0fdfa">
            <center>
            <h1><font color="#f472b6">No hay una sesión activa. Inicia sesión para actualizar la fecha del último acceso.</font></h1>
            </center>
            </body>
            `)
    }
});


//Ruta para obtener el estado de la sesión
app.get('/status', (req, res) => {
    if(req.session.isLoggedIn) {
        const now = new Date();
        const started = new Date(req.session.createAt);
        const lastUpdate = new Date(req.session.lastAccess);

        //Calcular la antigüedad de la sesión
        const sessionAgeMs = now - started;
        const hours = Math.floor(sessionAgeMs / (1000 * 60 *60));
        const minutes = Math.floor((sessionAgeMs / (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((sessionAgeMs % (1000 * 60)) / 1000);

        //Convertir las fechas al huso horario de la CDMX
        const createAt_CDMX = moment(started).tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss');
        const lastAccess_CDMX = moment(lastUpdate).tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss');

        res.json({
            mensaje: 'Estado de la sesión',
            sessionId: req.sessionID,
            inicio: createAt_CDMX,
            ultimoAcceso: lastAccess_CDMX,
            antiguedad: `${hours} horas, ${minutes} y ${seconds} segundos`
        });
    } else {
        res.send(`
            <body style="background-color:#f0fdfa">
            <center>
            <h1><font color="#f472b6">No hay una sesión activa. Inicia sesión primero para revisar el estado de la sesión.</font></h1>
            </center>
            </body>
            `);
    }
});


//Iniciar el servidor en el puerto 3000
app.listen(3000, () => {
    console.log('Servidor corriendo en el puerto 3000');
})

