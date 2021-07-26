const { app, BrowserWindow } = require('electron');

function createWindow () {
    // Cree la fenetre du navigateur.
    let win = new BrowserWindow({
        // width: 800,
        // height: 600,
        fullscreen: true,
        webPreferences: {
            nodeIntegration: true
        },
        transparent: true,
        frame: false,
    });

    // and load the index.html of the app.
    win.loadFile('index.html');

    win.webContents.openDevTools();
}

app.on('ready', createWindow);
