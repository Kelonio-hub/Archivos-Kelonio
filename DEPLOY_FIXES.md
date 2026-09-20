# Correcciones de la V2

Esta entrega corrige dos problemas detectados tras la primera subida:

1. Las guías tenían una estructura de layout incorrecta: el encabezado y el contenido eran hijos independientes del grid. Ahora todo el contenido de cada guía está dentro de `main.guide-container`.
2. La web `guias.html` dependía de que GitHub Pages publicase el artefacto `dist/`. Esta entrega incluye también el árbol público `guias/` en la raíz para que funcione si Pages está configurado para publicar la rama `main` directamente.

## Duplicados

Las fuentes originales de las guías siguen existiendo para poder reconstruir la web, pero han cambiado de extensión a `src/guides/*.html.part`. No son páginas HTML públicas duplicadas.

Dentro de `guias/` hay dos tipos de archivos:

- URL canónica: `slug.html`
- URL histórica: conserva el nombre antiguo y redirige inmediatamente a la canónica.

Las URLs históricas llevan `noindex` y no aparecen en el índice de guías.

## Publicación recomendada

La configuración preferida sigue siendo GitHub Pages mediante Actions, publicando `dist/` generado por `.github/workflows/build.yml`.

La raíz pública `guias/` se incluye para que el sitio funcione también con Pages configurado sobre la rama `main`.
