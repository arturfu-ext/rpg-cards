const fse = require('fs-extra');
const request = require('request');
const path = require('path');
const yauzl = require("yauzl");

const downloadUrl = "https://game-icons.net/archives/svg/zip/ffffff/transparent/game-icons.net.svg.zip";
const tempDir = "./temp";
const tempFilePath = tempDir + "/temp" + Date.now() + ".zip";
const iconDir = "./public/icons";
const customIconDir = "./resources/custom-icons";
const customIconAssetsDir = "./resources/custom-icons-assets";
const cssPath = "./resources/generated/icons.css";
const jsPath = "./resources/generated/icons.js";


// ----------------------------------------------------------------------------
// Download
// ----------------------------------------------------------------------------
function downloadFile(url, dest) {
    console.log("  Downloading...");
    return new Promise((resolve, reject) => {
        request(url)
            .pipe(fse.createWriteStream(dest))
            .on("close", resolve)
            .on("error", reject);
    });
}

// ----------------------------------------------------------------------------
// Unzip
// ----------------------------------------------------------------------------
function unzipAll(src, dest) {
    console.log("  Unzipping...");
    return new Promise((resolve, reject) => {
        yauzl.open(src, {lazyEntries: true}, function(err, zipfile) {
            if (err) {
                reject(err);
                return;
            }
            zipfile.readEntry();
            zipfile.on("entry", function(entry) {
                if (/\/$/.test(entry.fileName)) {
                    // Directory file names end with '/'. Note that entries for
                    // directories themselves are optional. An entry's fileName
                    // implicitly requires its parent directories to exist.
                    zipfile.readEntry();
                } else {
                    var entryPath = path.parse(entry.fileName);
                    var fileName = entryPath.base;
                    var targetFile = path.join(dest, fileName);
                    var i = 2;
                    while (true) {
                        if (!fse.existsSync(targetFile)) {
                            break;
                        }
                        fileName = entryPath.name + "-" + i++ + entryPath.ext;
                        targetFile = path.join(dest, fileName);
                    }
                    zipfile.openReadStream(entry, function(err, readStream) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        readStream
                            .on("end", function() {
                                zipfile.readEntry();
                            }).pipe(
                                fse.createWriteStream(targetFile)
                                    .on("error", reject)
                            ).on("error", reject);
                    });
                }
            }).on("close", resolve);
        });
    });
}

// ----------------------------------------------------------------------------
// Generate CSS
// ----------------------------------------------------------------------------
// The icon dir can hold the same basename with two extensions (e.g.
// mixed-swords.png from resources/custom-icons and mixed-swords.svg from
// resources/custom-icons-assets, kept on disk so the custom-icons.css alias
// URLs resolve). Class/picker names must stay unique: keep the first file in
// sorted order (.png sorts before .svg, preserving the historical rules).
function uniqueIconFiles(files) {
    const imageExtensions = [".svg", ".png"];
    const seen = new Set();
    return files
        .filter(fileName => imageExtensions.find(ext => ext === path.extname(fileName)))
        .sort()
        .filter(fileName => {
            const base = path.basename(fileName, path.extname(fileName));
            if (seen.has(base)) return false;
            seen.add(base);
            return true;
        });
}

function generateCSS(src, dest) {
    console.log("  Generating CSS...");
    return new Promise((resolve, reject) => {
        fse.readdir(src, (err, files) => {
            if (err) {
                reject(err);
            }
            else {
                const content = uniqueIconFiles(files)
                    .map(name => `.icon-${path.basename(name, path.extname(name))} { background-image: url(../icons/${name});}\n`)
                    .join("");
                fse.writeFile(dest, content, err => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            }
        });
    });
}

// ----------------------------------------------------------------------------
// Generate JS
// ----------------------------------------------------------------------------
function generateJS(src, dest) {
    console.log("  Generating JS...");
    return new Promise((resolve, reject) => {
        fse.readdir(src, (err, files) => {
            if (err) {
                reject(err);
            }
            else {
                const content = "var icon_names = [\n" + uniqueIconFiles(files)
                    .map(name => `    "${path.basename(name, path.extname(name))}"`)
                    .join(",\n") + "\n]";
                fse.writeFile(dest, content, err => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            }
        });
    });
}

// ----------------------------------------------------------------------------
// Copy
// ----------------------------------------------------------------------------
function cleanDirectory(src) {
    console.log("  Cleaning...");
    return new Promise((resolve, reject) => {
        fse.emptyDir(src, (err) => {
            if (err) { reject(); return; }
            resolve();
        });
    }); 
}

function removeFile(filePath) {
    console.log("  Removing file...");
    return new Promise((resolve, _) => {
        fse.remove(filePath, () => resolve());
    }); 
}

function copyAll(src, dest) {
    console.log("  Copying...");
    return new Promise((resolve, reject) => {
        fse.copy(src, dest, err => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}

function moveAll(src, dest) {
    console.log("  Moving...");
    return new Promise((resolve, reject) => {
        fse.copy(src, dest, err => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}

// --regen-only: rebuild icons.css/icons.js from the existing icon dir
// without re-downloading the icon set.
if (process.argv.includes("--regen-only")) {
    Promise.resolve()
        .then(() => console.log("Icons: regenerate css/js only"))
        .then(() => generateCSS(iconDir, cssPath))
        .then(() => generateJS(iconDir, jsPath))
        .then(() => console.log("Icons: done"))
        .catch(err => console.log("Icons: error", err));
} else {
    fse.emptyDir(tempDir)
        .then(() => console.log("Icons: start"))
        .then(() => cleanDirectory(tempDir))
        .then(() => downloadFile(downloadUrl, tempFilePath))
        .then(() => unzipAll(tempFilePath, tempDir))
        .then(() => removeFile(tempFilePath))
        .then(() => cleanDirectory(iconDir))
        .then(() => moveAll(tempDir, iconDir))
        .then(() => copyAll(customIconDir, iconDir))
        .then(() => copyAll(customIconAssetsDir, iconDir))
        .then(() => generateCSS(iconDir, cssPath))
        .then(() => generateJS(iconDir, jsPath))
        .then(() => cleanDirectory(tempDir))
        .then(() => console.log("Icons: done"))
        .catch(err => console.log("Icons: error", err));
}
