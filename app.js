(function () {
    "use strict";

    const DATOS = window.GALERIA;
    const TAMANO_PAGINA = 18;

    if (!DATOS || !Array.isArray(DATOS.items)) {
        return;
    }

    const estado = {
        categoria: "todas",
        consulta: "",
        orden: "recientes",
        pagina: 1,
        filtrados: [],
        indiceLightbox: 0,
        listaLightbox: [],
        focoAnterior: null
    };

    const refs = {};
    let temporizadorBusqueda = null;

    function iniciar() {
        refs.categoriasGrid = document.getElementById("categorias-grid");
        refs.filtros = document.getElementById("filtros-galeria");
        refs.galeriaGrid = document.getElementById("galeria-grid");
        refs.galeriaVacio = document.getElementById("galeria-vacio");
        refs.rangoRegistros = document.getElementById("rango-registros");
        refs.contadorFiltrados = document.getElementById("contador-filtrados");
        refs.contadorResultados = document.getElementById("contador-resultados");
        refs.paginaActual = document.getElementById("pagina-actual");
        refs.totalPaginas = document.getElementById("total-paginas");
        refs.paginacion = document.getElementById("paginacion-galeria");
        refs.paginacionNumeros = document.getElementById("paginacion-numeros");
        refs.paginaAnterior = document.getElementById("pagina-anterior");
        refs.paginaSiguiente = document.getElementById("pagina-siguiente");
        refs.btnLimpiarFiltros = document.getElementById("btn-limpiar-filtros");
        refs.buscador = document.getElementById("buscador-galeria");
        refs.orden = document.getElementById("orden-galeria");

        refs.lightbox = document.getElementById("lightbox");
        refs.lightboxCodigo = document.getElementById("lightbox-codigo");
        refs.lightboxTitulo = document.getElementById("lightbox-titulo");
        refs.lightboxImagen = document.getElementById("lightbox-imagen");
        refs.lightboxPrediccion = document.getElementById("lightbox-prediccion");
        refs.lightboxFecha = document.getElementById("lightbox-fecha");
        refs.lightboxArchivo = document.getElementById("lightbox-archivo");
        refs.lightboxDescarga = document.getElementById("lightbox-descarga");
        refs.lightboxAnterior = document.getElementById("lightbox-anterior");
        refs.lightboxSiguiente = document.getElementById("lightbox-siguiente");
        refs.lightboxContador = document.getElementById("lightbox-contador");
        refs.lightboxCerrar = document.getElementById("lightbox-cerrar");

        actualizarEstadisticas();
        renderizarCategorias();
        renderizarFiltros();
        conectarEventos();
        renderizarGaleria(true);
    }

    function normalizar(texto) {
        return String(texto)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    function sincronizarConsulta() {
        window.clearTimeout(temporizadorBusqueda);
        estado.consulta = refs.buscador.value;
    }

    function crearElemento(etiqueta, clase, texto) {
        const elemento = document.createElement(etiqueta);
        if (clase) elemento.className = clase;
        if (texto !== undefined) elemento.textContent = texto;
        return elemento;
    }

    function actualizarEstadisticas() {
        document.querySelectorAll('[data-stat="total"]').forEach((elemento) => {
            elemento.textContent = DATOS.total;
        });
        document.querySelectorAll('[data-stat="dias"]').forEach((elemento) => {
            elemento.textContent = DATOS.rango.dias;
        });
    }

    function renderizarCategorias() {
        const fragmento = document.createDocumentFragment();

        DATOS.categorias.forEach((categoria) => {
            const boton = crearElemento("button", "categoria");
            boton.type = "button";
            boton.dataset.categoria = categoria.clave;
            boton.title = `Ver ${categoria.total} registros de ${categoria.nombre}`;

            boton.append(
                crearElemento("span", "categoria-codigo", categoria.codigo),
                crearElemento("span", "categoria-nombre", categoria.nombre),
                crearElemento(
                    "span",
                    "categoria-total",
                    `${categoria.total} ${categoria.total === 1 ? "registro" : "registros"}`
                )
            );

            boton.addEventListener("click", () => {
                seleccionarCategoria(categoria.clave, true);
            });

            fragmento.append(boton);
        });

        refs.categoriasGrid.replaceChildren(fragmento);
        actualizarCategoriasActivas();
    }

    function renderizarFiltros() {
        const fragmento = document.createDocumentFragment();
        const opciones = [{ clave: "todas", nombre: "Todas", total: DATOS.total }].concat(
            DATOS.categorias
        );

        opciones.forEach((categoria) => {
            const boton = crearElemento("button", "filtro");
            boton.type = "button";
            boton.dataset.filtro = categoria.clave;
            if (categoria.clave === estado.categoria) {
                boton.classList.add("activo");
            }
            boton.setAttribute("aria-pressed", String(categoria.clave === estado.categoria));

            boton.append(
                document.createTextNode(categoria.nombre),
                crearElemento("span", "", String(categoria.total))
            );

            boton.addEventListener("click", () => {
                seleccionarCategoria(categoria.clave, false);
            });

            fragmento.append(boton);
        });

        refs.filtros.replaceChildren(fragmento);
    }

    function seleccionarCategoria(clave, desplazar) {
        sincronizarConsulta();
        estado.categoria = clave;
        estado.pagina = 1;

        if (desplazar && refs.buscador.value) {
            refs.buscador.value = "";
            estado.consulta = "";
        }

        actualizarCategoriasActivas();
        actualizarFiltrosActivos();
        renderizarGaleria(false);

        if (desplazar) {
            desplazarAGaleria();
        }
    }

    function desplazarAGaleria() {
        const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        document.getElementById("galeria").scrollIntoView({
            behavior: reducirMovimiento ? "auto" : "smooth",
            block: "start"
        });
    }

    function actualizarCategoriasActivas() {
        refs.categoriasGrid.querySelectorAll(".categoria").forEach((boton) => {
            const activa = boton.dataset.categoria === estado.categoria;
            boton.classList.toggle("activa", activa);
            boton.setAttribute("aria-pressed", String(activa));
        });
    }

    function actualizarFiltrosActivos() {
        refs.filtros.querySelectorAll(".filtro").forEach((boton) => {
            const activo = boton.dataset.filtro === estado.categoria;
            boton.classList.toggle("activo", activo);
            boton.setAttribute("aria-pressed", String(activo));
        });
    }

    function obtenerFiltrados() {
        const terminos = normalizar(estado.consulta).split(/\s+/).filter(Boolean);

        return DATOS.items
            .filter((item) => {
                if (estado.categoria !== "todas" && item.categoria !== estado.categoria) {
                    return false;
                }
                if (!terminos.length) {
                    return true;
                }
                const contenido = normalizar(
                    `${item.nombre} ${item.categoria} ${item.codigo} ${item.fecha} ${item.dia} ${item.hora}`
                );
                return terminos.every((termino) => contenido.includes(termino));
            })
            .sort((a, b) => {
                if (estado.orden === "antiguos") {
                    return a.stamp - b.stamp;
                }
                if (estado.orden === "categoria") {
                    const comparacion = a.nombre.localeCompare(b.nombre, "es");
                    return comparacion !== 0 ? comparacion : b.stamp - a.stamp;
                }
                return b.stamp - a.stamp;
            });
    }

    function totalPaginas() {
        return Math.max(1, Math.ceil(estado.filtrados.length / TAMANO_PAGINA));
    }

    function obtenerPaginas(pagina, total) {
        if (total <= 9) {
            return Array.from({ length: total }, (_, indice) => indice + 1);
        }

        const paginas = [1];
        const inicio = Math.max(2, pagina - 1);
        const fin = Math.min(total - 1, pagina + 1);

        if (inicio > 2) paginas.push("...");
        for (let actual = inicio; actual <= fin; actual += 1) {
            paginas.push(actual);
        }
        if (fin < total - 1) paginas.push("...");
        paginas.push(total);
        return paginas;
    }

    function irAPagina(pagina, moverScroll) {
        const total = totalPaginas();
        const nueva = Math.min(Math.max(1, pagina), total);
        if (nueva === estado.pagina) return;
        estado.pagina = nueva;
        renderizarGaleria(false);
        if (moverScroll) {
            desplazarAGaleria();
        }
    }

    function renderizarPaginacion(total) {
        total = Math.max(1, total);
        /* La navegación siempre se muestra; solo se desactivan los botones fuera de rango */
        refs.paginacion.hidden = false;
        refs.paginaAnterior.disabled = estado.pagina <= 1;
        refs.paginaSiguiente.disabled = estado.pagina >= total;

        const fragmento = document.createDocumentFragment();
        obtenerPaginas(estado.pagina, total).forEach((valor) => {
            if (valor === "...") {
                fragmento.append(crearElemento("span", "paginacion-puntos", "…"));
                return;
            }

            const boton = crearElemento("button", "paginacion-boton", String(valor));
            boton.type = "button";
            boton.setAttribute("aria-label", `Ir a la página ${valor}`);
            if (valor === estado.pagina) {
                boton.setAttribute("aria-current", "page");
            }
            boton.addEventListener("click", () => irAPagina(valor, true));
            fragmento.append(boton);
        });

        refs.paginacionNumeros.replaceChildren(fragmento);
    }

    function renderizarGaleria(reiniciar) {
        if (reiniciar) {
            estado.pagina = 1;
        }

        estado.filtrados = obtenerFiltrados();
        /* Si no hay filtros (carga inicial), mostrar las 18 tarjetas primeras */
        if (estado.filtrados.length === 0) {
            estado.filtrados = DATOS.items.slice(0, TAMANO_PAGINA);
        }
        const total = totalPaginas();
        if (estado.pagina > total) {
            estado.pagina = total;
        }

        const inicio = (estado.pagina - 1) * TAMANO_PAGINA;
        const visibles = estado.filtrados.slice(inicio, inicio + TAMANO_PAGINA);
        const fragmento = document.createDocumentFragment();

        visibles.forEach((item, indice) => {
            const tarjeta = document.createElement("button");
            tarjeta.type = "button";
            tarjeta.className = "tarjeta";
            tarjeta.setAttribute(
                "aria-label",
                `Abrir registro de ${item.nombre} del ${item.fecha}. Predicción número 1 de la IA.`
            );

            const cabecera = crearElemento("span", "tarjeta-cabecera");
            cabecera.append(
                crearElemento("span", "tarjeta-codigo", item.codigo),
                crearElemento("span", "tarjeta-categoria", item.nombre),
                crearElemento("span", "tarjeta-fecha", item.fecha)
            );

            const contenedorImagen = crearElemento("span", "tarjeta-imagen");
            const imagen = document.createElement("img");
            imagen.src = item.imagen;
            imagen.alt = `Ficha del registro clasificado como ${item.nombre}: trazo original, máscara de tinta, entrada de 28 por 28 píxeles y predicciones de la IA.`;
            imagen.loading = "lazy";
            imagen.decoding = "async";
            imagen.width = 1280;
            imagen.height = 470;
            contenedorImagen.append(imagen);

            const pie = crearElemento("span", "tarjeta-pie");
            pie.append(
                crearElemento("span", "", `Predicción #1 · ${item.nombre}`),
                crearElemento("span", "tarjeta-ver", "Ver ficha ↗")
            );

            tarjeta.append(cabecera, contenedorImagen, pie);
            tarjeta.addEventListener("click", () => abrirLightbox(inicio + indice));
            fragmento.append(tarjeta);
        });

        refs.galeriaGrid.replaceChildren(fragmento);

        const hayResultados = estado.filtrados.length > 0;
        refs.galeriaVacio.hidden = hayResultados;
        refs.galeriaGrid.hidden = !hayResultados;

        const rango = hayResultados
            ? `${inicio + 1}–${inicio + visibles.length}`
            : "0";

        refs.rangoRegistros.textContent = rango;
        refs.contadorFiltrados.textContent = estado.filtrados.length;
        refs.paginaActual.textContent = estado.pagina;
        refs.totalPaginas.textContent = total;
        refs.contadorResultados.innerHTML = `<span>${estado.filtrados.length}</span> ${
            estado.filtrados.length === 1 ? "registro" : "registros"
        }`;

        renderizarPaginacion(total);
    }

    function abrirLightbox(indice) {
        estado.listaLightbox = estado.filtrados.slice();
        estado.indiceLightbox = indice;
        estado.focoAnterior = document.activeElement;

        rellenarLightbox();
        refs.lightbox.hidden = false;
        document.body.classList.add("lightbox-abierto");

        requestAnimationFrame(() => {
            refs.lightboxCerrar.focus();
        });
    }

    function rellenarLightbox() {
        const item = estado.listaLightbox[estado.indiceLightbox];
        if (!item) return;

        refs.lightboxCodigo.textContent = item.codigo;
        refs.lightboxTitulo.textContent = item.nombre;
        refs.lightboxPrediccion.textContent = item.nombre;
        refs.lightboxFecha.textContent = item.fecha;
        refs.lightboxArchivo.textContent = item.archivo;
        refs.lightboxImagen.src = item.imagen;
        refs.lightboxImagen.alt = `Ficha completa del registro de ${item.nombre} del ${item.fecha}.`;
        refs.lightboxDescarga.href = item.imagen;
        refs.lightboxDescarga.setAttribute("download", item.archivo);
        refs.lightboxContador.textContent = `${estado.indiceLightbox + 1} / ${
            estado.listaLightbox.length
        }`;

        refs.lightboxAnterior.disabled = estado.indiceLightbox === 0;
        refs.lightboxSiguiente.disabled =
            estado.indiceLightbox === estado.listaLightbox.length - 1;

        precargarVecinos();
    }

    function precargarVecinos() {
        [estado.indiceLightbox - 1, estado.indiceLightbox + 1].forEach((indice) => {
            const vecino = estado.listaLightbox[indice];
            if (vecino) {
                const imagen = new Image();
                imagen.src = vecino.imagen;
            }
        });
    }

    function moverLightbox(paso) {
        const nuevoIndice = estado.indiceLightbox + paso;
        if (nuevoIndice < 0 || nuevoIndice >= estado.listaLightbox.length) {
            return;
        }
        estado.indiceLightbox = nuevoIndice;
        rellenarLightbox();
    }

    function cerrarLightbox() {
        refs.lightbox.hidden = true;
        document.body.classList.remove("lightbox-abierto");
        if (estado.focoAnterior && typeof estado.focoAnterior.focus === "function") {
            estado.focoAnterior.focus();
        }
    }

    function conectarEventos() {
        refs.buscador.addEventListener("input", (evento) => {
            window.clearTimeout(temporizadorBusqueda);
            temporizadorBusqueda = window.setTimeout(() => {
                estado.consulta = evento.target.value;
                renderizarGaleria(true);
            }, 120);
        });

        refs.orden.addEventListener("change", (evento) => {
            sincronizarConsulta();
            estado.orden = evento.target.value;
            renderizarGaleria(true);
        });

        refs.paginaAnterior.addEventListener("click", () => {
            irAPagina(estado.pagina - 1, true);
        });

        refs.paginaSiguiente.addEventListener("click", () => {
            irAPagina(estado.pagina + 1, true);
        });

        refs.btnLimpiarFiltros.addEventListener("click", () => {
            window.clearTimeout(temporizadorBusqueda);
            estado.categoria = "todas";
            estado.consulta = "";
            estado.orden = "recientes";
            estado.pagina = 1;
            refs.buscador.value = "";
            refs.orden.value = "recientes";
            actualizarCategoriasActivas();
            actualizarFiltrosActivos();
            renderizarGaleria(false);
            refs.buscador.focus();
        });

        refs.lightboxCerrar.addEventListener("click", cerrarLightbox);

        refs.lightbox.addEventListener("click", (evento) => {
            if (evento.target.hasAttribute("data-cerrar-lightbox")) {
                cerrarLightbox();
            }
        });

        refs.lightboxAnterior.addEventListener("click", () => moverLightbox(-1));
        refs.lightboxSiguiente.addEventListener("click", () => moverLightbox(1));

        document.addEventListener("keydown", manejarTeclado);
    }

    function manejarTeclado(evento) {
        if (refs.lightbox.hidden) return;

        if (evento.key === "Escape") {
            evento.preventDefault();
            cerrarLightbox();
            return;
        }

        if (evento.key === "ArrowLeft") {
            evento.preventDefault();
            moverLightbox(-1);
            return;
        }

        if (evento.key === "ArrowRight") {
            evento.preventDefault();
            moverLightbox(1);
            return;
        }

        if (evento.key === "Tab") {
            mantenerFoco(evento);
        }
    }

    function mantenerFoco(evento) {
        const enfocables = refs.lightbox.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!enfocables.length) return;

        const primero = enfocables[0];
        const ultimo = enfocables[enfocables.length - 1];

        if (evento.shiftKey && document.activeElement === primero) {
            evento.preventDefault();
            ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
            evento.preventDefault();
            primero.focus();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }
})();
