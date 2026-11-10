# Liberaciones TSF3

Registro de liberaciones topográficas de la presa de relaves: los topógrafos registran en campo (también sin señal), gabinete genera los protocolos y los entrega a Calidad, y el jefe de área ve el avance.

- `index.html`: la app completa (Firebase Firestore + acceso con Google).
- `sw.js`: permite abrir la app sin señal (guarda la página, el logo y Firebase al instalarse).
- `lib/heic2any.min.js`: conversor de fotos HEIC a JPG (se baja solo si hace falta).
- `manifest.webmanifest` e `iconos/`: nombre, logo y atajos de la app instalada.
- `DESIGN.md`: guía de diseño («Cuaderno de obra»): colores, tipografía, botones, ventanas, tablas y filtros. Todo cambio visual la sigue.
- `firestore.rules`: reglas de seguridad. Se copian en Firebase → Firestore Database → Reglas → Publicar.

Incluye: acceso con Google y roles (operario, topógrafo, gabinete, jefe, administrador), registro en campo sin señal con CSV y fotos, bandeja de gabinete con código SKT-TOP único, panel («Qué falta», perfil por capas y planta) que lee un resumen por frente, modelo 2D para gabinete (eje y secciones de Civil 3D en LandXML más la superficie de cada liberación), confirmación antes de las acciones importantes, rechazo con motivo, papelera, «no se libera» rápido desde el panel, versión de computadora con menú lateral, buscador Ctrl+K, clic derecho y acciones en grupo, ajustes, depuración de fotos de entregados antiguos (Ajustes → Archivos), aviso de tramos superpuestos, avance por capa en planta real con XML base y porcentaje por área, corrección de entregados con motivo, exportación a CSV y app instalable con logo.

## Tipos de liberación y elementos

- En «Nueva», Elemento y Tipo son un solo buscador **«Qué se liberó»**: arriba salen los tipos que más usa cada persona, y al escribir encuentra el tipo aunque tenga tildes, mayúsculas, plurales, letras cambiadas, palabras en otro orden o abreviaturas («rell trans» → Relleno de transición). El elemento se pone solo.
- Topógrafos, operarios y gabinete pueden **agregar** un tipo (y su elemento, si hace falta). Antes de crearlo la app muestra los nombres parecidos que ya existen y ofrece usar ese; si es el mismo nombre escrito distinto, no deja crearlo. Los números cuentan: «filtro 3» es distinto de «filtro 2». Hace falta señal.
- Lo agregado desde campo se usa al instante y aparece en **Ajustes → Tipos → Agregados desde campo** (el menú lo avisa). Si se parece a uno que ya existe, el botón principal es **«Unir con «…»»** (un toque): sus registros y sus capas pasan al nombre correcto y el repetido se quita. «Es distinto» lo deja como tipo nuevo.
- **Ajustes → Tipos** tiene dos vistas:
  - **Catálogo:** los tipos agrupados por elemento, con buscador y cuántos registros tiene cada uno. «En perfil» decide si se dibuja como capa. En «⋯»: cambiar elemento (y pasar sus registros), unir con otro tipo, desactivar (con «Deshacer»).
  - **Orden en el perfil:** solo los que se dibujan, numerados (1 = la capa de abajo). Se escribe la posición y el tipo se mueve de una vez; las flechas siguen sirviendo.
- Los cambios se guardan sobre la lista recién llegada de Firebase, así un tipo agregado desde campo mientras se ordena ya no se pierde. «Guardado» sale cuando Firebase lo confirma.

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

- Gabinete **observa** con una nota (uno o varios a la vez, también un «En proceso» desde su ficha). Si hay observados, **Mis registros abre directo en ellos** y van primero en la lista.
- Al **editar** un observado, la nota de gabinete se ve arriba del formulario. Al guardar vuelve a «Pendiente» y el historial dice **qué cambió** («PK 3+000 – 3+040 → 3+000 – 3+035»).
- En la Bandeja, lo que volvió corregido lleva la marca **«Corregido»** con lo que se había pedido.
- Si un registro **ya tenía código** (se observó o devolvió estando En proceso), al aceptarlo de nuevo vuelve a «En proceso» **con su mismo código** (antes quedaba trabado).
- Antes de guardar una edición la app revisa si **otra persona cambió el registro** mientras tanto y muestra qué cambió, para no pisarlo a ciegas.
- Un **rechazado** propio tiene «Duplicar como nuevo»: abre «Nueva» con los mismos datos (sin archivos) para registrarlo otra vez.
- Un **entregado a Calidad** solo lo corrige el administrador, y siempre con **motivo** (queda en el historial).

## Bandeja: menos clics

- La **ficha pasa sola al siguiente** después de aceptar, observar, rechazar o entregar, y tiene ‹ › («2 de 9») y las flechas ← → del teclado.
- **Teclado en computadora:** j/k moverse, x marcar, Enter abrir, a aceptar, o observar, e entregar. **Mayús+clic** marca un rango. Al aceptar uno, Enter genera el código.
- En grupo también se puede **observar, rechazar y devolver** (misma nota para todos). Si al aceptar en grupo alguno falla, los demás siguen y los que fallaron quedan marcados.
- **«Devolver a pendientes»** ya no pide confirmación: el aviso trae «Deshacer».
- Filtros de **frente y topógrafo**; la pestaña y estos filtros **se recuerdan**.
- Marcar casillas no redibuja la lista, y los datos que llegan de Firebase no quitan el foco ni cierran un desplegable abierto (se espera a soltar el campo).
- Sin señal, observar, rechazar, entregar y devolver avisan «se subirá cuando haya señal»; los diálogos esperan a que se guarde y, si falla, no se pierde lo escrito.

## Entregar a Calidad: carpeta de OneDrive

- Al **entregar a Calidad** (uno o varios) se pide la **carpeta de OneDrive** donde quedaron los archivos: se pega el vínculo (en OneDrive: clic derecho en la carpeta → «Compartir» → «Copiar vínculo») o la ruta. Sin carpeta no se entrega. Las últimas carpetas usadas se sugieren al escribir.
- La ficha muestra **«Abrir carpeta»** (o la ruta, con «Copiar»). Gabinete puede ponerla o cambiarla en registros en proceso o entregados («Poner carpeta OneDrive» / «Cambiar carpeta»); en los entregados antiguos sin carpeta la ficha dice «Falta».
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

Ya instalada abre en su propia ventana, sin barra del navegador, y funciona sin señal. Mantener presionado el ícono muestra atajos (Nueva, Mis registros, Bandeja, Panel). El ícono muestra un número con lo pendiente (observados, bandeja y solicitudes de acceso, según el rol). Cuando se publica una versión nueva con la app abierta aparece «Hay una versión nueva · Actualizar». La app pide al teléfono no borrar lo guardado sin señal cuando falta espacio.

- `pruebas/`: pruebas automáticas con Firebase simulado y datos inventados (ver `pruebas/README.md`).
