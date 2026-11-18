# Liberaciones TSF3

Registro de liberaciones topográficas de la presa de relaves: los topógrafos registran en campo (también sin señal), gabinete genera los protocolos y los entrega a Calidad, y el jefe de área ve el avance.

- `index.html`: la app completa (Firebase Firestore + acceso con Google).
- `sw.js`: permite abrir la app sin señal (guarda la página, el logo y Firebase al instalarse).
- `lib/heic2any.min.js`: conversor de fotos HEIC a JPG (se baja solo si hace falta).
- `manifest.webmanifest` e `iconos/`: nombre, logo y atajos de la app instalada.
- `DESIGN.md`: guía de diseño («Cuaderno de obra»): colores, tipografía, botones, ventanas, tablas y filtros. Todo cambio visual la sigue.
- `firestore.rules`: reglas de seguridad. Se copian en Firebase → Firestore Database → Reglas → Publicar.

Incluye: acceso con Google y roles (operario, topógrafo, gabinete, jefe, administrador), registro en campo sin señal con CSV y fotos, bandeja de gabinete con código SKT-TOP único, panel («Qué falta», perfil por capas y planta) que lee un resumen por frente, modelo 2D para gabinete (eje y secciones de Civil 3D en LandXML más la superficie de cada liberación), confirmación antes de las acciones importantes, rechazo con motivo, papelera, «no se libera» rápido desde el panel, versión de computadora con menú lateral, buscador Ctrl+K, clic derecho y acciones en grupo, ajustes, depuración de fotos de entregados antiguos (Ajustes → Archivos), aviso de tramos superpuestos, avance por capa en planta real con XML base y porcentaje por área, corrección de entregados con motivo, exportación a CSV y app instalable con logo.

## Cómo se numeran las versiones

Desde el 18/11/2026 la versión lleva tres números, **grande.mediano.mínimo** (la antigua «versión 43» es la 1.43.0):

- **Mínimo** (1.43.0 → 1.43.1): arreglo chico, un texto, algo mal colocado.
- **Mediano** (1.43.2 → 1.44.0): función nueva o cambio que se nota al trabajar.
- **Grande** (1.44.0 → 2.0.0): rediseño, cambio de reglas de Firebase o de la forma de trabajar.

`VERSION_APP` en `index.html` y `CACHE` en `sw.js` (`liberaciones-v1.43.1`) suben juntos; `pruebas/prueba12.js` espera el nombre de la caché.

## Versión 1.43.2: los menores de la revisión

Cambio mínimo. No cambia las reglas de Firebase.

- **Registros**: los chips de estado quedan marcados al elegir varios (Ctrl o Mayús + clic); el contador del encabezado es el de las filas que se ven; las fechas llevan el año si no es el actual; el título de la columna de fecha dice qué fecha muestra; «Ver registros» de una importación dice de cuál es y entra sin los filtros recordados.
- **Excel**: columna «Seguimiento» (Por ver, Enterado, Por procesar, Procesado) y «registros» en vez de «liberaciones» cuando hay levantamientos, aspas o dron.
- **Diálogos**: Enter al abrir no abre otro igual encima; Ctrl+K no se abre sobre un diálogo.
- **Campo**: la etiqueta de la fecha sigue a la actividad («…del levantamiento», «…del vuelo», «…de las aspas»); el estado de levantamientos y aspas se llama «No lleva código»; «Registrado por» muestra el nombre (se guarda `creadoNombre` al crear; en los antiguos, lo anterior a la «@»); una ruta prohibida escrita a mano deja la dirección en la pantalla que se muestra; «Editar» otro registro con una edición a medias pregunta antes.
- **Ajustes**: no se puede renombrar un frente, tipo o capa a un nombre que ya existe («Capa 02» y «Capa 2» son la misma); las capas se guardan ordenadas y las ocultas no se sugieren en «Nueva»; «Cotas en serie» siempre a la vista (sin selección aplica a todas); la importación recuerda los emparejamientos hechos a mano; el correo exige un dominio válido; avisa si un topógrafo queda sin clave.
- **Modelo 2D**: un eje LandXML con una curva sin centro se rechaza con aviso.

## Versión 1.43.1: cosas en su sitio (14 arreglos de posición)

Cambio mínimo. No cambia las reglas de Firebase ni la forma de trabajar.

- **«Nueva» en celular** ya no se ensancha cuando un tipo sugerido tiene nombre largo: el texto parte línea.
- **Ajustes → Capas y Lugares** caben en laptops de 1100 a 1700 px sin cortar nombres ni sacar botones; **Usuarios** sin el hueco bajo «Solicitudes» y con los correos largos partidos.
- **«Acceso solicitado» y «Cuenta desactivada»** parten un correo largo en celular.
- **El aviso (toast)** sube si taparía el campo con error, el campo enfocado o los botones del pie de la ficha. «Panel preparado…» solo sale en el Panel.
- **Registros en tableta (960–1024 px)**: chips de estado en dos líneas y filtros del mismo ancho. Los registros sin código dicen «Sin código» en vez de un guion.
- **Planta en celular**: el selector «Tipo» queda dentro de su tarjeta y los rótulos de PK y de frente no se pisan con el eje.
- **Resumen para WhatsApp**: los botones de periodo quedan fijos arriba.
- **Textos cortados** con «…» y el texto completo al pasar el ratón o mantener pulsado (Ctrl+K, archivos de la ficha, Panel).
- **Letra de al menos 12 px** en cabeceras, etiquetas y contadores, y contraste de 4,5:1 o más donde se leía mal.

## Versión 43: las acciones en grupo siempre a la vista y toques más grandes

No cambia las reglas de Firebase.

- **Barra de acciones en grupo** (Bandeja y Registros): al marcar una casilla queda fija abajo, siempre visible, y la lista ya no salta. «Seleccionar todo» no desaparece al marcar.
- **Ficha abierta en pantallas de 1320 a 1799 px**: se pliega la columna de filtros (y la de Frente) para que se vean el código, la liberación y el botón de acción de cada fila sin desplazarse de lado.
- **Cabecera de la ficha pegajosa**: la ✕, las flechas y «Copiar» siguen a la vista al bajar.
- **Pantallas táctiles**: casillas, cabeceras, «No aplica progresiva», «Ver», «Ver todas», «Deshacer» y el ojo, los tramos y los huecos del Perfil tienen al menos 44 px de zona de toque; con ratón se ve igual.
- **Salir de una edición con cambios** (a otra pantalla o con el botón atrás) pregunta antes de descartar. «Registrar este tramo» y «Duplicar» preguntan antes de reemplazar una liberación a medio llenar.

## Versión 42: lo escrito y lo adjuntado ya no se pierde

No cambia las reglas de Firebase.

- **Fotos y archivos del borrador**: se guardan en el teléfono (IndexedDB) junto con el borrador de «Nueva» y vuelven solos si la página se recarga o el sistema cierra la pestaña (por ejemplo al abrir la cámara). Si el teléfono no deja guardarlos, un aviso dice cuáles hay que volver a adjuntar. Se borran al guardar, al «Limpiar» y al salir de la sesión.
- **PK «2,500» o «2.500»** (sin «+»): el formulario ya no lo toma como 2,5 m; muestra las dos lecturas («2+500» · «0+002.50») y no guarda hasta elegir.
- **Fecha de campo futura**: no se puede guardar (10 minutos de margen).
- **Recargar mientras se edita** un registro vuelve a «Editar registro» con lo escrito; si el registro ya no se puede editar, lo avisa.
- **«Nueva» mientras se edita** pregunta si seguir editando o descartar y abrir uno nuevo.
- **Ajustes → Usuarios**: lo escrito en «Agregar por correo» no se borra cuando llega una solicitud o cambia un usuario.
- **Ajustes**: un guardado rechazado (Lugares, Topógrafos, Tipos, Protocolos, Capas, «no se libera») vuelve a lo que había, en vez de quedar en pantalla como guardado.

## Versión 41: el Panel ya no muestra datos falsos

No cambia las reglas de Firebase ni los datos guardados.

- **La misma capa escrita distinto** («Capa 1», «capa 1», «Capa 01») cuenta como una sola en Perfil, Qué falta, Planta, tabla de avance, filtros de capa de Registros y Bandeja, hoja «Resumen» del Excel, CSV de avance diario y el aviso de superposición al guardar.
- **Con filtros de estado, topógrafo o fecha**, lo que falta y el % cuentan siempre todo lo liberado del frente; el filtro solo resalta lo que coincide (lo demás sale tenue y se puede tocar) y una nota lo dice. Ya no se ofrece «Registrar este tramo» sobre algo liberado.
- Los números de arriba dicen «· sin filtros» cuando hay filtros; «Registradas hoy» pasa a «Liberadas hoy en campo».
- En «Qué falta», un tramo con el PK al revés se dibuja completo. El total de la tabla de avance de Planta no dice 100 % si queda algún hueco.
- Un PK como 999,996 se escribe «1+000» (antes «0+1000»).

## Versión 40: los registros antiguos del buscador se pueden trabajar

No cambia las reglas de Firebase. **Después de publicar, el administrador pulsa una vez «Reconstruir resumen»** (Ajustes → Histórico) para que los levantamientos y aspas antiguos muestren «Por ver», «Enterado», «Por procesar» o «Procesado» en la lista.

- Desde la versión 39 el buscador de **Registros** muestra también registros antiguos con datos resumidos. Ahora todo lo que se hace sobre ellos lee primero el registro completo (solo al actuar, nunca al escribir ni al pintar la lista).
- **«⋯» y selección en grupo**: «Observar», «Devolver a pendientes», «Entregar a Calidad», «Marcar enterado» y «Mandar a la papelera» funcionan igual que desde la ficha. Si un registro ya no existe se avisa cuál y no se cambia nada; «Entregar» nunca se salta el control del XML.
- **Ficha**: las flechas y «›» avanzan por los resultados, y tras una acción pasa al siguiente.
- **La lista se pone al día sola** tras cambiar un registro antiguo (fila y chips), sin volver a escribir la búsqueda.
- **Excel** de lo seleccionado o lo filtrado: lee los registros completos (con progreso) para que salgan descripción, fechas y «Registrado por». Sin señal no exporta, para no entregar un Excel incompleto.
- El resumen guarda si un levantamiento o unas aspas ya están «Enterado» o «Procesado».

## Versión 39: el buscador de Registros busca en todo el historial

No cambia las reglas de Firebase.

- En **Registros** (gabinete, jefe y administrador), al escribir en el buscador se busca **en todo el historial**, no solo en los últimos 100, sin pedirlo. El encabezado dice «N coincidencias en todo el historial» y una nota avisa que los registros antiguos traen datos resumidos (no se busca por descripción). Sin texto todo sigue igual.
- Mientras llega el historial dice «Buscando en todo el historial…» (nunca «Nada coincide») y al terminar la lista se redibuja sin quitar el foco ni el cursor del buscador.
- Si no hay resultados y hay **filtros o estado** puestos, lo dice («con los filtros puestos») y ofrece **«Buscar sin filtros»**, que los quita y conserva lo escrito.
- Un **PK** escrito («2+500», «0+012.5») encuentra también el tramo que lo contiene (inicio y fin inclusive). Vale en Registros, en la Bandeja y en Ctrl+K.
- «Mis registros» busca igual que antes.

## Versión 38: exportar a Excel con la marca de la app

No cambia las reglas de Firebase.

- Lo que se exporta desde **Registros** (lista o lo filtrado), la **selección** (Registros y Bandeja), una **capa del Panel** (clic derecho) y una **importación** ahora baja como **Excel (.xlsx)**, no como CSV.
- **Hoja «Liberaciones»:** título con la marca, de qué es y desde dónde salió (pantalla y filtros, o frente y capa del Panel), quién lo exportó y cuándo, y un resumen (cuántas por estado, metros de eje y tramo de PK). Cabecera de color, líneas, filas alternadas, **estado con su color**, fechas como fechas, PK como 2+340, largo en metros, columnas a su ancho, filtro en la cabecera y N° y código fijos al desplazarse. Se imprime apaisado y a una página de ancho.
- **El código va una sola vez** (con los otros códigos del mismo levantamiento, si los hay); «Protocolos» muestra solo el nombre del protocolo. Ya no salen «Key_Status» repetido ni columnas vacías.
- **Hoja «Resumen»:** por estado y por frente · tipo · capa (liberaciones, metros, tramo y última fecha), con total.
- «Exportar lo que falta liberar» de una capa también baja en Excel con la misma marca y su total.
- **Ajustes → Exportar** sigue en CSV con las columnas del Excel de protocolos, porque es el formato para el «Log».

## Versión 37: Planta con avance, rueda con Ctrl y exportar una capa

No cambia las reglas de Firebase.

- **Planta:** el dibujo ya no se sale de su cuadro al acercar o mover. «Tipo» y «Capa» van con su etiqueta bajo el título; los tipos con liberaciones salen primero (con cuántas tienen) y al entrar se elige el que más tiene. «Más liberados» deja cambiar de tipo en un toque. Si el tipo no tiene liberaciones en la estructura, lo dice y ofrece los que sí tienen.
- **Avance de la planta:** debajo, una tabla con el % liberado de cada capa en cada frente y el total (sin contar lo que no se libera). Tocar una capa la muestra en la planta. Los frentes sin eje lo dicen, con «subir».
- **Rueda con Ctrl:** en el Perfil, la Planta y el Modelo 2D la rueda sola baja la página como siempre; para acercar se mantiene Ctrl (o ⌘) y se gira la rueda (un aviso lo recuerda). En el Modelo 2D en pantalla completa la rueda acerca directo.
- **Clic derecho en el nombre de una capa** (Perfil): exportar todos los datos de sus liberaciones (CSV con las mismas columnas que Registros), exportar los tramos que faltan liberar, verla en Registros (con frente, tipo y capa ya filtrados) u ocultarla.

## Versión 36: columna de filtros más ordenada

No cambia las reglas de Firebase.

- Los filtros de la columna empiezan **plegados** (solo los títulos, con cuántas opciones hay marcadas) y se quedan como los dejes, también al volver a abrir la app. «Desplegar todo» / «Plegar todo» arriba.
- **Fecha** solo con botones (Todas, Hoy, Ayer, Esta semana, Últimos 7 días, Este mes, Un día, Entre fechas); ya no se repite en un desplegable. Plegada, dice qué fecha está puesta.
- Un solo **«Limpiar todo»**, junto a los filtros puestos sobre la tabla (Registros y Bandeja).
- Entre 1200 y 1500 px la tabla cabe entera con la columna de filtros abierta (fecha y topógrafo en dos líneas).

## Versión 35: revisión de computadora (media pantalla y pantalla completa)

No cambia las reglas de Firebase. El celular y «Mis registros» quedan igual.

- **Media pantalla** (ventana partida, desde 860 px): Registros y Bandeja ya no se ven como en el celular. Tabla compacta con los filtros de siempre en una fila (fecha, tipo, frente, topógrafo, actividad, equipo, capa).
- **Registros y Bandeja en pantalla completa:**
  - Los filtros puestos se ven sobre la tabla, con cuántos registros quedan, y cada uno se quita con su ✕.
  - «Ocultar filtros» deja la tabla a todo lo ancho (se recuerda) y «Filtros (N)» la vuelve a mostrar.
  - La cabecera de la tabla queda fija al bajar por la lista.
- **Ajustes en pantalla ancha:** Tipos y Lugares pasan a lista y detalle. A la izquierda los elementos (o estructuras) con su número; a la derecha el elegido completo, sin desplegables. «+ Nuevo elemento», «+ Nueva estructura» y «Equipos» están en la misma lista. Al buscar se ven todos los grupos que coinciden.
- **Ajustes a media pantalla:** siguen los desplegables, ahora con una animación suave al abrir.
- **Modelo 2D:** los filtros de la lista de capas se leen completos. En pantalla completa, «Ocultar capas» (tecla C) quita la columna izquierda y el modelo usa todo el ancho.

## Versión 34: Panel en computadora y listas desplegables en Ajustes

No cambia las reglas de Firebase. El celular queda igual.

- **Perfil:** rueda del ratón para acercar un tramo (queda como filtro de «Progresiva» a la izquierda, con su % y su «Qué falta liberar»), arrastrar para moverse y doble clic o «Ver todo el frente» para volver. La regla de progresivas se queda arriba al bajar. **Filas compactas** para ver más capas a la vez (se recuerda).
- **Planta:** más alta en computadora; rueda para acercar sin deformar, arrastrar, botones + − y «Todo». Los nombres y progresivas no se agrandan.
- **Qué falta:** las capas en dos columnas (tres en pantallas muy anchas).
- **Abajo del perfil:** «Qué falta liberar» y la lista de liberaciones lado a lado.
- **Ajustes, listas desplegables:** cada grupo de Tipos muestra 8 y «Ver todos (N)»; cada estructura de Lugares, 6 frentes; Capas, 12; Topógrafos, 10; Equipos, 6. La flecha de la cabecera pliega el grupo entero. Al buscar se ve todo lo que coincide. Lo plegado se recuerda.

## Versión 33: computadora para gabinete y jefe de área

No cambia las reglas de Firebase. El celular queda igual.

- **Todo el ancho:** Bandeja, Registros, Panel y Ajustes ya no se cortan en 1280 px; en una pantalla Full HD se usa todo el espacio.
- **Columna de filtros con conteos** (Registros y Bandeja, desde 1200 px): fecha con botones rápidos (Hoy, Ayer, Esta semana…), frente, tipo, capa, topógrafo, actividad y equipo. Se marcan **varias opciones a la vez** y cada una dice cuántos registros quedarían. Cada filtro se pliega y, si tiene muchas opciones, se busca dentro. Se recuerdan al volver.
- **Tabla compacta:** una línea por registro con columnas Código y estado, Liberación (tipo · capa y la descripción al lado), Frente, Progresiva y Fecha y topógrafo. En laptop (1366) la descripción se oculta para que todo quepa.
- **Filtros en la cabecera, como en Excel:** clic en el título de una columna para ordenar (↑ ↓) y filtrar (estado, tipo, capa, frente, topógrafo). La columna ordenada o filtrada queda marcada.
- **Ficha a la derecha** sin tapar la tabla.
- **Ajustes con menú lateral:** las 9 secciones en una columna a la izquierda; Usuarios en dos columnas (solicitudes y agregar | con acceso), Tipos con los grupos lado a lado, Capas con la lista y los tramos que no se liberan juntos, Protocolos e Histórico en dos columnas.

## Versión 32: Modelo 2D como mesa de trabajo en computadora

No cambia las reglas de Firebase.

- **Rueda del ratón para acercar** en la planta real, la desarrollada y la sección, dejando fijo el punto bajo el cursor. Se arrastra para moverse y con doble clic (o «Todo») se vuelve a ver todo.
- **Sin deformar:** la planta real va siempre a escala (ya no estira el ancho); los códigos, las progresivas y los rayados se quedan del mismo tamaño al acercar, y aparecen más progresivas y más códigos.
- **Lectura bajo el cursor:** Este, Norte, progresiva y desfase en la planta; desfase, cota y la línea más cercana (con su Δz si es una liberación) en la sección.
- **Sección:** la rejilla se afina hasta el centímetro, el acercamiento se mantiene al pasar de sección (para comparar el mismo sitio), y se elige la escala vertical: ajustar, real 1:1, ×2, ×5 o ×10.
- **Medir** (tecla M): dos clics en la sección dan horizontal, vertical, distancia y pendiente; el cursor se pega a los vértices.
- **Superficies de diseño editables:** en la leyenda se toca una para ocultarla o mostrarla, y «Editar» abre la lista completa para elegir cuáles se dibujan, con qué nombre y color. Se guarda en el modelo del frente (lo ve todo gabinete); el XML no cambia y se conserva al reemplazar el eje. Ahora hay 20 colores distintos (antes se repetían desde la superficie 11).
- **Todo el espacio:** en computadora el Modelo 2D usa el ancho completo. «Pantalla completa» (tecla F) quita el menú, hace caber planta y sección en la ventana, pone la leyenda y la tabla al costado y deja repartir el alto con un divisor. Flechas ← → cambian de sección; Esc sale.

## Versión 31: arreglo del importador

- «Crear el tipo» al emparejar ya no crea un segundo tipo si uno con ese nombre y elemento ya existe (por ejemplo, el creado en la importación anterior): se usa ese.

## Versión 30: importaciones mes a mes (Ajustes → Histórico)

No cambia las reglas de Firebase.

- **Lo registrado en la app nunca se toca:** ni al importar ni al quitar. Tampoco un importado que después se trabajó en la app (entregado, con archivos, XML, carpeta, notas, papelera o cualquier cambio en su historial). Los cambios en lote de Ajustes (renombrar capa, unir tipos, cambiar clave, mover frente) no cuentan como trabajo.
- **Se carga el Excel directo** (.xlsx, la misma hoja «Log» de protocolos; también CSV o el JSON de antes). Ya no hace falta convertirlo aparte.
- **Vista previa antes de escribir:** cuántos son nuevos, cuántos se actualizan, cuántos ya estaban iguales y cuántos no se tocan porque ya están en la app (con la lista de lo que el archivo dice distinto, descargable). Avisa capa y cota sacadas de la descripción («Capa:30», «Cota: Variable»), claves de topógrafo nuevas y cuánto sube el correlativo.
- **Emparejar nombres:** un frente o un tipo que no está en las listas, o un tipo con el mismo nombre pero de otro elemento (p. ej. «Relleno en zanja» de Tubería en una fila de Movimiento de tierras), se elige a mano o se crea. «Cómo se leyó el archivo» deja revisar y cambiar todos.
- **Cada carga es una importación con nombre** (por defecto, su rango de fechas). En la lista: **Ver registros** (Registros muestra solo esa carga), **Descargar** (CSV) y **Quitar** (solo esa; las demás no se tocan). Lo cargado antes de esta versión aparece como «Importado antes (sin nombre)».
- Un código que ya estaba importado y sin tocar se actualiza y pasa a la importación nueva; nunca se duplica. Las fechas del Excel quedan en su día (mediodía) y, dentro del día, en el orden de los códigos.
- **A prueba de choques:** las revisiones leen del servidor (nunca de la copia del teléfono o la PC); el correlativo sube antes de escribir; importar y quitar van por tandas que vuelven a leer cada registro y lo saltan si alguien lo trabajó en ese momento; y si la carga se corta, la importación queda en la lista como «se cortó» y al volver a importar el mismo archivo se completa sin duplicar. Solo se cargan códigos con el prefijo de la obra.
- **Respaldo completo:** descarga todos los registros, el historial, las listas, la configuración y el correlativo en un archivo para guardar fuera de Firebase. Al quitar, primero se descarga una copia de lo que se quita (se puede volver a cargar).

## Versión 29: roces del trabajo diario (etapa 1 del análisis desde cero)

Sale del informe `analisis/informe.md` (hallazgos H6 a H13). No cambia las reglas de Firebase.

- **«Guardar» siempre a la vista:** en «Nueva» y al editar, el botón queda fijo sobre el menú de abajo (en computadora, al pie de la ventana); ya no hay que bajar todo el formulario. **«Limpiar»** pasó arriba, junto al título, lejos del pulgar; al editar, «Cancelar» sigue junto a «Guardar cambios».
- **«Mis registros» abre en «Todos»:** lo recién guardado se ve siempre. Los observados van primero y un recuadro los avisa, con «Ver solo esos».
- **Ficha:** la ✕ ya no queda encima de las flechas «anterior / siguiente». **«Rechazar»** salió de la fila de botones y va al pie, junto a «Mandar a la papelera».
- **Bandeja en celular:** cada tarjeta deja «Aceptar» y «Observar» (o «Devolver a pendientes»); «Rechazar», «Editar» y la capa están en «⋯». En la barra de grupo, «Rechazar» y la papelera van al final, separados a la derecha. Toda la celda de la casilla marca la fila.
- **Gabinete entra a la Bandeja** la primera vez (después se recuerda la última pantalla, como siempre).
- **Panel:** los cuatro números van arriba también en celular y dicen de qué son («Solo el frente …» o, en Planta, «Toda la estructura …»).
- **«Registrado por»** muestra el nombre cuando se conoce (el propio, o cualquiera para jefe y administrador); si no, el correo.
- **Al entregar,** la fecha de la ventana dice **«Fecha de entrega a Calidad»** (en la ficha, «Fecha de entrega» sigue siendo la del código).
- **Tableta echada:** una pantalla táctil ancha usa el diseño de computadora con botones de 44 px.
- No se cambiaron los nombres de los estados («Pendiente topografía», «En proceso», «Entregado a Calidad»): es una decisión del equipo, pendiente.

## Tipos de liberación y elementos

- En «Nueva», Elemento y Tipo son un solo buscador **«Qué se liberó»**: arriba salen los tipos **usados en el frente elegido** (versión 28, del resumen del frente y sus capas configuradas) y luego los que más usa cada persona; en «Ver todos» y al buscar, los del frente van primero con la marca «usado aquí». Al escribir encuentra el tipo aunque tenga tildes, mayúsculas, plurales, letras cambiadas, palabras en otro orden o abreviaturas («rell trans» → Relleno de transición). El elemento se pone solo.
- Topógrafos, operarios y gabinete pueden **agregar** un tipo (y su elemento, si hace falta). Antes de crearlo la app muestra los nombres parecidos que ya existen y ofrece usar ese; si es el mismo nombre escrito distinto, no deja crearlo. Los números cuentan: «filtro 3» es distinto de «filtro 2». Hace falta señal.
- **Detalle (versión 28):** el código o número puntual de un registro (PZ3-7, BH-12) va en el campo **«Detalle»**, no en el nombre del tipo. Si al agregar un tipo el nombre termina en un código («… piezómetro casagrande pz3-7»), la app ofrece **«Separar»**: el tipo queda general (y se reutiliza para el siguiente piezómetro) y el código pasa al detalle. El detalle entra en la descripción automática, la ficha y la búsqueda.
- Lo agregado desde campo se usa al instante y aparece en **Ajustes → Tipos → Agregados desde campo** (el menú lo avisa). Ahí mismo se **corrige el nombre y el elemento** antes de tocar «Está bien» (Enter también sirve); si el nombre trae un código, **«Separar detalle»** lo pasa al detalle de sus registros. «N registros» abre la lista de esos registros. Si se parece a uno que ya existe, el botón principal es **«Unir con «…»»** (un toque); **«Unir con otro…»** abre un buscador con los parecidos arriba y cuántos registros tiene cada uno. Al unir, sus registros, capas y superficies pasan al nombre correcto y el repetido se quita; el aviso trae **«Deshacer»** (10 s), que lo devuelve todo. «Es distinto» lo deja como tipo nuevo.
- Reglas (versión 28): el jefe puede escribir `detalle` al separar (función `soloTipo`); gabinete no toca el detalle de campo. Hay que publicar `firestore.rules`.
- **Ajustes → Tipos** tiene dos vistas:
  - **Catálogo (versión 26):** cada **elemento** es una tarjeta con sus tipos debajo. El nombre del elemento o del tipo se cambia escribiendo encima (el id no cambia, los registros siguen enlazados). Cada tarjeta tiene su fila **«Nuevo tipo»** (ya con su elemento) y al final está **«Nuevo elemento»**. Buscador, cuántos registros tiene cada uno y «Ver desactivados» (ocultos por defecto).
    - «⋯» del tipo: cambiar elemento (y pasar sus registros), unir con otro tipo (también uno desactivado), mover en el perfil, desactivar (con «Deshacer») y **quitar de la lista** (solo si no tiene registros ni superficies XML; con «Deshacer»).
    - «⋯» del elemento: mover arriba o abajo, unir con otro elemento (sus tipos y registros pasan), desactivar (con «Deshacer») y **quitar** (solo si no tiene tipos ni registros).
  - **Orden en el perfil:** solo los que se dibujan, numerados (1 = la capa de abajo). Se escribe la posición y el tipo se mueve de una vez; las flechas siguen sirviendo.
- Los cambios se guardan sobre la lista recién llegada de Firebase, así un tipo agregado desde campo mientras se ordena ya no se pierde. «Guardado» sale cuando Firebase lo confirma.

## Ajustes → Lugares: estructuras y frentes (versión 26)

- Cada **estructura** es una tarjeta con sus **frentes** (nombre, PK inicio, PK final, eje y cuántos registros tiene). Buscador y «Ver desactivados».
- «⋯» de la estructura: mover arriba o abajo, desactivar (con «Deshacer», sin confirmar) y **quitar** (solo si ni ella ni sus frentes tienen registros, superficies XML ni bases).
- «⋯» del frente: mover arriba o abajo, **mover a otra estructura** (sus registros pasan con él), desactivar (con «Deshacer») y **quitar** (si no tiene registros; se borran también su eje y sus capas configuradas, pide confirmar).
- Las filas se identifican por id y cada cambio parte de la lista recién llegada de Firebase: si otra persona cambió algo mientras tanto, no se pisa.

## Capas: renombrar sin perder la superficie XML (versión 26)

- Al **renombrar una capa** en Ajustes → Capas, sus registros, sus **superficies XML** del Modelo 2D y su base pasan al nombre nuevo (queda en el historial). Lo mismo al unir tipos, y al cambiar la capa o el tipo de un registro entregado con XML.
- «Superficies (XML)» y «Ver en el modelo» leen la capa actual de la superficie, así siempre muestran el nombre nuevo.

## Equipo y levantamiento con dron

- En «Nueva» se marca el **Equipo** con que se hizo (Estación total, GNSS o Dron; la lista se edita en Ajustes → Tipos). Es obligatorio al registrar y el siguiente registro ya viene con el mismo.
- **Levantamiento con dron** es una actividad propia: el equipo queda en Dron y el registro llega a la Bandeja de gabinete como «Por aceptar».
- Al aceptarlo, gabinete ve marcados los **protocolos de esa zona** y puede quitar o agregar. Los protocolos y las zonas (estructura completa o frentes) donde aplica cada uno se arman en **Ajustes → Protocolos**.
- En Ajustes → Protocolos también se elige si se genera **un código SKT-TOP por protocolo** (por defecto) o **uno solo** para todo el levantamiento. Los códigos salen seguidos del mismo correlativo; en las listas se ve «+2» junto al código cuando hay más de uno.

## Fotos HEIC

Las cámaras Samsung con «Imágenes de alta eficiencia» y los iPhone guardan fotos HEIC, que el navegador del celular no abre. La app las convierte a JPG en el teléfono antes de reducirlas, con `lib/heic2any.min.js` (licencia MIT), que solo se baja cuando hace falta; con señal se deja guardado en segundo plano una vez, para poder convertir también sin señal en campo. Si no se puede convertir, la app explica qué hacer (conectarse o desactivar «Imágenes de alta eficiencia» en la cámara).

## Filtros de Registros

Registros y Mis registros filtran por **fecha** (hoy, ayer, esta semana de lunes a domingo, últimos 7 días, este mes, un día o entre fechas), **tipo de liberación**, **frente** (o toda la estructura), **topógrafo**, **actividad**, **equipo** y **sin capa**, además de la búsqueda y el estado. En computadora es una barra sobre la tabla; en el celular, un renglón que abre una hoja con «Aplicar» y chips con lo activo. Con fechas, Registros pide a Firebase justo ese rango, así encuentra también registros antiguos.

- En Registros se elige **qué fecha** se filtra: de liberación (la que se pone en campo), de entrega (cuando gabinete genera el código) o de entrega a Calidad. Así «qué entregó JS esta semana» sale directo.
- Nombres de las fechas (versión 25): la que antes decía «Fecha en campo» ahora dice **«Fecha de liberación»**, y la que decía «Fecha liberación» ahora dice **«Fecha de entrega»**. Los datos guardados y las columnas del CSV no cambian.
- La búsqueda **ignora tildes y mayúsculas** («transicion» encuentra «Transición») y también busca por la clave del topógrafo (JS, CS…). Lo mismo en la Bandeja y en Ctrl+K.
- **Estado:** un clic elige uno; con Ctrl o Mayús + clic se suman varios. Si hay pendientes y observados aparece el chip «Pendientes + observados». Los números de los chips cuentan lo que se ve (con la búsqueda y sin los eliminados).
- Sin fechas, Registros mira los últimos 100; si hay filtros lo avisa y ofrece **«Buscar en todo el historial»** (usa el resumen de todos los frentes).
- **Exportar lo filtrado** baja a CSV justo lo que se ve, sin tener que marcar filas.
- Los filtros **se recuerdan** al recargar (por persona; la búsqueda escrita no). «Limpiar filtros» quita todo, también el estado y la búsqueda.
- En «Entre fechas», si «desde» es posterior a «hasta», se toman al revés y se avisa.
- Ctrl+K espera a que se deje de escribir, refresca el histórico cada 5 minutos y ahora también lo usan topógrafos y operarios (solo sobre sus registros).

## Observados y correcciones

- Gabinete **observa** con una nota (uno o varios a la vez, también un «En proceso» desde su ficha). Si hay observados, van primero en **Mis registros** y un recuadro lo avisa («Tienes 1 observado por corregir · Ver solo ese»); la lista abre siempre en «Todos» (versión 29).
- Al **editar** un observado, la nota de gabinete se ve arriba del formulario. Al guardar vuelve a «Pendiente» y el historial dice **qué cambió** («PK 3+000 – 3+040 → 3+000 – 3+035»).
- En la Bandeja, lo que volvió corregido lleva la marca **«Corregido»** con lo que se había pedido.
- Si un registro **ya tenía código** (se observó o devolvió estando En proceso), al aceptarlo de nuevo vuelve a «En proceso» **con su mismo código** (antes quedaba trabado).
- Antes de guardar una edición la app revisa si **otra persona cambió el registro** mientras tanto y muestra qué cambió, para no pisarlo a ciegas.
- Un **rechazado** propio tiene «Duplicar como nuevo»: abre «Nueva» con los mismos datos (sin archivos) para registrarlo otra vez.
- Un **entregado a Calidad** solo lo corrige el administrador, y siempre con **motivo** (queda en el historial).

## Bandeja: menos clics

- Pestañas de gabinete: **Por aceptar**, **Observadas**, **En proceso** (antes «Por entregar»; mismo nombre que el estado en Registros) y Levantamientos.

- La **ficha pasa sola al siguiente** después de aceptar, observar, rechazar o entregar, y tiene ‹ › («2 de 9») y las flechas ← → del teclado.
- **Teclado en computadora:** j/k moverse, x marcar, Enter abrir, a aceptar, o observar, e entregar. **Mayús+clic** marca un rango. Al aceptar uno, Enter genera el código.
- En grupo también se puede **observar, rechazar y devolver** (misma nota para todos). Si al aceptar en grupo alguno falla, los demás siguen y los que fallaron quedan marcados.
- **«Devolver a pendientes»** ya no pide confirmación: el aviso trae «Deshacer».
- Filtros de **frente y topógrafo**; la pestaña y estos filtros **se recuerdan**.
- Marcar casillas no redibuja la lista, y los datos que llegan de Firebase no quitan el foco ni cierran un desplegable abierto (se espera a soltar el campo).
- Sin señal, observar, rechazar, entregar y devolver avisan «se subirá cuando haya señal»; los diálogos esperan a que se guarde y, si falla, no se pierde lo escrito.

## Entregar a Calidad: carpeta de OneDrive

- Al **entregar a Calidad** (uno o varios) se pide la **carpeta de OneDrive** donde quedaron los archivos: se pega el vínculo (en OneDrive: clic derecho en la carpeta → «Compartir» → «Copiar vínculo»), la ruta o cualquier nota. **Es opcional y de texto libre (versión 26):** se puede entregar sin carpeta y ponerla después. Si se entregan varios sin escribir carpeta, cada uno conserva la que ya tenía. Las últimas carpetas usadas se sugieren al escribir.
- La ficha muestra **«Abrir carpeta»** (o la ruta, con «Copiar»). Gabinete puede ponerla, cambiarla o quitarla (dejando el campo vacío) en registros en proceso o entregados («Poner carpeta OneDrive» / «Cambiar carpeta»).
- La carpeta sale en el CSV exportado (columna «Carpeta OneDrive») y queda en el historial.

## Entregar a Calidad: XML de la superficie (obligatorio)

- Al **entregar a Calidad**, gabinete sube el **XML de Civil 3D** con la superficie de cada liberación («Subir XML» en el mismo diálogo). En grupo se eligen varios XML a la vez y cada uno se empareja por su código.
- La superficie tiene que llevar en el nombre el **mismo código SKT-TOP** de la liberación (por ejemplo `2+220_2+260_STN F1_SKT-TOP-02686`). Si trae otro código, no tiene código o el archivo no es un LandXML, **no se acepta** y se dice por qué. Mientras falte el XML de alguna, no se entrega.
- La superficie se guarda en el **Modelo 2D** de su frente con el tipo y la capa de la liberación, y la ficha muestra «Superficie (XML)» con el archivo entregado. El historial anota el XML.
- Las reglas de Firebase también lo exigen: un cambio a «Entregado a Calidad» hecho por gabinete sin XML se rechaza.
- **Jefe de área y administradores:** en Registros, el botón **«Superficies (XML)»** lleva a Panel → Modelo 2D, donde se ven las superficies de las liberaciones. En la ficha de un entregado, **«Ver en el modelo»** abre su frente y su capa con su superficie marcada.

## Topógrafos: cambiar la clave

- En **Ajustes → Topógrafos** (administrador y jefe de área) se toca la **clave** (JS, CS, AB…) para cambiarla. La nueva (2 a 5 letras) pasa a **todos sus registros**, al resumen del panel, al historial y a su cuenta; el Excel sale con la clave nueva.
- La clave vieja queda guardada como «antes»: un registro que llega tarde con ella (teléfono sin señal) se ve con el nombre del topógrafo y sale con la clave nueva en el Excel. Por eso **nadie más puede usar esa clave vieja**; volver a ella sí se puede.
- Un Excel del histórico que traiga la clave vieja se importa con la nueva.
- Se necesita señal. Si una cuenta no se puede actualizar (la propia o la de un administrador), se avisa para cambiarla en Ajustes → Usuarios.

## Etiquetas de estado y seguimiento (versión 27)

- Cada registro muestra su **estado** (Pendiente topografía, En proceso, Entregado a Calidad, Observado, Rechazado o Levantamiento) y, si no lleva código, su **seguimiento**:
  - **Aspas para vuelo de dron:** «Procesado» (al pasar el mouse dice quién) o «Por procesar» (borde punteado).
  - **Levantamientos:** «Enterado» o «Por ver».
- Es una sola regla para la tabla de computadora, la lista del celular, la ficha, el menú «⋯», Ctrl+K y el resumen de WhatsApp.
- En Registros hay chips para **filtrar** por «Por procesar», «Procesadas», «Por ver» y «Enterados».

## Aspas para vuelo de dron

Los levantamientos de aspas registrados en campo llegan a la **Bandeja → Aspas** del administrador y del jefe de área (el jefe ve la Bandeja con Aspas y Levantamientos; gabinete no ve Aspas). Desde la ficha se descargan el CSV y las fotos, y se marcan como procesados uno por uno o varios juntos; también se pueden devolver a «Por procesar». El número del menú cuenta los que faltan procesar.

## Gabinete: capa, traslape y sin editar lo de campo

Gabinete no edita lo que registra campo: acepta (y genera el código), observa, rechaza, entrega a Calidad y pone o corrige la capa. Al aceptar (uno o en grupo) o al cambiar la capa, la app avisa al instante si el tramo se superpone con otra liberación del mismo frente, tipo y capa. En campo la capa sigue siendo opcional. El administrador edita todo.

## Levantamientos en la Bandeja

Los levantamientos de campo (sin código) llegan a la pestaña «Levantamientos» de gabinete, jefe de área y administrador. Se marcan «Enterado» (uno o varios); quien lo registró ve «Enterado» en Mis registros. Se muestran como «Levantamiento» (antes «Sin liberación»).

## Resumen para WhatsApp

En Mis registros, «Resumen WhatsApp» arma el texto de hoy, ayer, ayer y hoy o de lo filtrado: por día y frente, con tipo, capa, PK, metros y código, y el total. Se puede corregir, copiar o abrir directo en WhatsApp.

## Modelo 2D: base de una capa

En un frente vacío se puede empezar subiendo la base (borde o superficie) de una capa: la capa se elige o se escribe al subirla, sin pasar por Ajustes. «Subir XML» reconoce un borde como base y, si es una superficie suelta, pregunta si es base o liberación. Después se suben las liberaciones poco a poco y el porcentaje se completa. En la lista de frentes se marcan los que ya tienen modelo (p. ej. «Presa Auxiliar Norte · 3 liberaciones + base»); un frente vacío dice dónde sí hay modelo; al abrir un frente se elige sola la capa con base para ver su porcentaje, y se recuerda la capa elegida en cada frente.

## Panel: datos para corregir y celular

El administrador y el jefe ven encima del gráfico un recuadro con los registros sin progresiva, fuera del rango del frente o de tipos que no se dibujan, cada uno con «Ver» (o el atajo a Ajustes); «Ocultar» lo esconde hasta que cambien los números. En el celular, el perfil pone el nombre de cada capa arriba y la franja a todo lo ancho, y sin una elección guardada muestra las últimas 5 capas de cada tipo («Ver todas» las muestra todas y se recuerda). Una capa escrita como «N/A», «-» o «sin capa» se toma como sin capa.

## Panel: filtros

- **Computadora:** columna izquierda con el frente y un acordeón (Filtros, Progresiva, Capas); se abre una sección a la vez y cada una muestra su resumen cerrada. En Capas hay buscador y los tipos se despliegan solo al tocarlos. Los cambios se aplican al instante.
- **Celular y tableta:** un solo renglón «Filtros · Capas 113 de 113» que abre una hoja desde abajo con lo mismo; se aplica al tocar «Aplicar».
- Lo que está filtrado aparece como chips encima del gráfico; la ✕ de cada chip lo quita.

## Instalar como app

- **Android (Chrome):** abrir la página y tocar «Instalar como app» en la pantalla de entrada o «Instalar» en la cabecera (también en el menú ⋮ → «Instalar app»).
- **iPhone (Safari):** botón Compartir → «Agregar a inicio».
- **Computadora (Chrome o Edge):** botón «Instalar» de la cabecera o el ícono de instalar en la barra de direcciones.

Ya instalada abre en su propia ventana, sin barra del navegador, y funciona sin señal. Mantener presionado el ícono muestra atajos (Nueva, Mis registros, Bandeja, Panel). El ícono muestra un número con lo pendiente (observados, bandeja y solicitudes de acceso, según el rol). Cuando se publica una versión nueva, **la app se actualiza sola** (versión 26): al momento si no hay nada escrito; si se está escribiendo, avisa «Hay una versión nueva · Actualizar» y se actualiza sola la próxima vez que se vuelva a la app sin nada pendiente (lo escrito queda en el borrador).

**Fecha del registro nuevo (versión 26):** si la app quedó abierta desde el día anterior, o el borrador es de ayer, el registro nuevo ya no sale con la fecha de ayer: mientras nadie cambie la fecha a mano, toma la hora actual al abrir «Nueva» y al volver a la app. Una fecha cambiada a mano se respeta. La app pide al teléfono no borrar lo guardado sin señal cuando falta espacio.

- `pruebas/`: pruebas automáticas con Firebase simulado y datos inventados (ver `pruebas/README.md`).
