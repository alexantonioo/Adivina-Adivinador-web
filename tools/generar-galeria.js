#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const DIR_IMAGENES = path.join(RAIZ, "imagenes");
const DIR_DATOS = path.join(RAIZ, "data");

const CATEGORIAS = [
    ["casa", "Casa"],
    ["sol", "Sol"],
    ["arbol", "Árbol"],
    ["nube", "Nube"],
    ["estrella", "Estrella"],
    ["luna", "Luna"],
    ["flor", "Flor"],
    ["palmera", "Palmera"],
    ["manzana", "Manzana"],
    ["triangulo", "Triángulo"],
    ["cara", "Cara"],
    ["ojo", "Ojo"],
    ["gato", "Gato"],
    ["perro", "Perro"],
    ["pez", "Pez"],
    ["pajaro", "Pájaro"],
    ["mariposa", "Mariposa"],
    ["coche", "Coche"],
    ["avion", "Avión"],
    ["barco", "Barco"],
    ["bicicleta", "Bicicleta"],
    ["montana", "Montaña"],
    ["guitarra", "Guitarra"],
    ["reloj", "Reloj"]
];

const MESES = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic"
];

const PATRON = /^adivina-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})-(\d{3})-([a-z]+)\.png$/;
const etiquetas = new Map(CATEGORIAS);
const codigos = new Map(CATEGORIAS.map(([clave], i) => [clave, `C-${String(i + 1).padStart(2, "0")}`]));

function leerArchivos() {
    if (!fs.existsSync(DIR_IMAGENES)) {
        throw new Error(`No existe la carpeta ${DIR_IMAGENES}.`);
    }
    return fs.readdirSync(DIR_IMAGENES).filter((archivo) => PATRON.test(archivo));
}

function analizar(archivo) {
    const coincidencia = archivo.match(PATRON);
    if (!coincidencia) return null;

    const [, anio, mes, dia, hora, minuto, segundo, milisegundo, clave] = coincidencia;
    if (!etiquetas.has(clave)) {
        console.warn(`[aviso] Categoría desconocida en ${archivo}; se omite.`);
        return null;
    }

    const numeroMes = Number(mes);
    const numeroDia = Number(dia);
    const stamp = Number(`${anio}${mes}${dia}${hora}${minuto}${segundo}${milisegundo}`);

    return {
        archivo,
        imagen: `imagenes/${archivo}`,
        categoria: clave,
        nombre: etiquetas.get(clave),
        codigo: codigos.get(clave),
        stamp,
        dia: `${anio}-${mes}-${dia}`,
        hora: `${hora}:${minuto}`,
        fecha: `${numeroDia} ${MESES[numeroMes - 1]} ${anio} · ${hora}:${minuto}`
    };
}

function main() {
    const items = leerArchivos()
        .map(analizar)
        .filter(Boolean)
        .sort((a, b) => b.stamp - a.stamp);

    const conteo = new Map(CATEGORIAS.map(([clave]) => [clave, 0]));
    items.forEach((item) => conteo.set(item.categoria, conteo.get(item.categoria) + 1));

    const categorias = CATEGORIAS.map(([clave, nombre]) => ({
        clave,
        nombre,
        codigo: codigos.get(clave),
        total: conteo.get(clave)
    }));

    const dias = [...new Set(items.map((item) => item.dia))].sort();
    const desde = items.length ? items[items.length - 1] : null;
    const hasta = items.length ? items[0] : null;

    const datos = {
        generado: new Date().toISOString(),
        total: items.length,
        rango: {
            desde: desde ? desde.dia : null,
            hasta: hasta ? hasta.dia : null,
            dias: dias.length
        },
        categorias,
        items
    };

    fs.mkdirSync(DIR_DATOS, { recursive: true });

    const contenidoJs = `window.GALERIA = ${JSON.stringify(datos, null, 4)};\n`;

    fs.writeFileSync(path.join(DIR_DATOS, "galeria.js"), contenidoJs, "utf8");
    fs.writeFileSync(path.join(DIR_DATOS, "galeria.json"), JSON.stringify(datos, null, 2), "utf8");

    console.log(`Galería generada: ${items.length} registros, ${categorias.length} categorías.`);
    console.log(`Rango: ${datos.rango.desde || "—"} → ${datos.rango.hasta || "—"} (${datos.rango.dias} día/s).`);
}

main();
