# Adivina Adivinador · Galería de la feria

Sitio de divulgación científica y galería visual del proyecto **Adivina Adivinador**, un modelo de inteligencia artificial entrenado para reconocer garabatos de 24 categorías.

El sitio reúne **137 registros reales** tomados durante el **XXVI Encuentro con la Física, Química, Matemática y Biología**. Cada imagen es una ficha PNG generada en vivo por la aplicación: incluye el trazo original, la máscara de tinta, la entrada de 28×28 píxeles que vio el modelo y el top-3 de predicciones.

## Ver el sitio

Una vez publicada en GitHub Pages:

<https://alexantonioo.github.io/Adivina-Adivinador-web/>

## Estructura

```text
.
├── index.html                  # Página principal
├── styles.css                  # Estilos blueprint y responsive
├── app.js                      # Filtros, búsqueda, orden y visor de fichas
├── 404.html                    # Página de error con la misma estética
├── assets/
│   ├── favicon.png
│   └── perfil-github.jpg
├── data/
│   ├── galeria.js              # Manifiesto que lee la web (generado)
│   └── galeria.json            # Copia del manifiesto en JSON (generado)
├── imagenes/                   # 137 capturas PNG de la feria
├── fonts/                      # Archivo y B612/B612 Mono autoalojadas
└── tools/
    └── generar-galeria.js      # Reconstruye el manifiesto desde los archivos
```

## Probar en local

No requiere compilación ni dependencias. Puedes abrir `index.html` directamente en un navegador moderno, porque el manifiesto se carga con una etiqueta `<script>` y no con `fetch`.

Para probar con la misma configuración de GitHub Pages, sirve la carpeta desde la raíz del proyecto:

```bash
python3 -m http.server 8000
```

Luego abre <http://localhost:8000>.

## Agregar nuevas capturas

1. Guarda las imágenes generadas por la aplicación dentro de `imagenes/`.
2. Mantén el formato de nombre que usa la app:

   ```text
   adivina-AAAAMMDD-HHMMSS-mmm-categoria.png
   ```

   Por ejemplo: `adivina-20261106-100610-672-gato.png`.

3. Regenera el manifiesto:

   ```bash
   node tools/generar-galeria.js
   ```

El script lee las imágenes, extrae la fecha, la hora y la categoría, cuenta los registros y reescribe `data/galeria.js` y `data/galeria.json`. Las categorías válidas son las 24 clases del modelo:

```text
casa, sol, arbol, nube, estrella, luna, flor, palmera, manzana,
triangulo, cara, ojo, gato, perro, pez, pajaro, mariposa, coche,
avion, barco, bicicleta, montana, guitarra, reloj
```

> La categoría del archivo corresponde a la **predicción número 1** de la IA, no necesariamente al objeto que la persona quería dibujar.

## Publicar en GitHub Pages

1. Sube los cambios a la rama `main`.
2. En GitHub, entra en **Settings → Pages**.
3. En **Build and deployment**, elige **Deploy from a branch**.
4. Selecciona la rama `main` y la carpeta `/ (root)`.
5. Guarda. GitHub publicará el sitio en la URL del proyecto.

El archivo `.nojekyll` evita que GitHub Pages procese el sitio con Jekyll.

## Cómo funciona la galería

- `data/galeria.js` contiene el manifiesto con los 137 registros.
- `app.js` pinta las categorías, los filtros y las tarjetas, y gestiona la búsqueda, el orden y el visor ampliado.
- Las imágenes usan `loading="lazy"` para no descargar las 137 capturas de golpe.
- El visor se puede cerrar con `Esc` y recorrer con las flechas `←` y `→`.
- Todo el sitio funciona sin frameworks ni dependencias externas en tiempo de ejecución.

## Créditos

Proyecto desarrollado por **Alex Contreras** y **Jasneidy Pernia** para el **XXVI Encuentro con la Física, Química, Matemática y Biología**.

- Aplicación y modelo: <https://github.com/alexantonioo/quick-draw>
- Perfil: <https://github.com/alexantonioo>
- Código de esta web: <https://github.com/alexantonioo/Adivina-Adivinador-web>

Proyecto con fines educativos y de divulgación científica. Los dibujos son registros anónimos tomados durante la feria; ninguna imagen se envió a un servidor.
