Build: Aplicacion para Gestion Cambio de Tunros

Se requiere construir una app que permita

	.- Construye el proyecto a partir de la ruta de mi pc C:\Users\Juan Carlos Etayo\cambiodeturnos
	En la ruta: C:\Users\Juan Carlos Etayo\cambiodeturnos\images se encuentran los logos de la Clinica
	.- El color azul debe utilizar este:#0D2D6B y con constrastes de este azul #16468E
	

1.- Infraestructura
	Github (ya cuento con MCP para todo el despliegue)
		El nombre del repositorio deber ser: cambiodeturnos
	Supabase (ya cuento con MCP para todo el despliegue)
		El nombre del repositorio deber ser: cambiodeturnos
	Resend (ya cuento con MCP para todo el despliegue)
		La API Key deben llamarse notificacionturnos
	Google Sheets
		https://docs.google.com/spreadsheets/d/1t7VMZsQ4x4crgmJxVZEUjs_b8f9WOqMcDoqbU0xOYJo/edit?gid=0#gid=0
		
		Aqui tengo los datos que he venido gestionando desde la app desarrollada en Google AppScritp, a partir de esta informacion la cual esta en la hoja "DATA"
		requiero que analises estos datos para que desde aqui inciemos el desarrollo
		
		En la hoja "CORREOS" se encuentra la informacion de los usuarios permitidos para dar Aceptada o Negada la solicitud
	Apps Scripts
		https://script.google.com/home/projects/168WnUjVLAFlz6UryhQXlBrWrkhJ5I28P0uR6d4MR1ElSp2z0b9DnD9MG/edit
		
		Aqui tengo todo el codigo fuente como base para el analisis
		
	
2.- La palicacion debe tener las siguientes condiciones
		Debe contar con un acceso a traves de credenciales basadas en correo electronico y contraseña
		Utiliza el modelo el login de acuerdo a la imagen que comparto
		Los usuarios tipo "Asistencial" solo podran diligenciar el formulario de solicitud
		Los usuarios tipo "Coordinadores" solo podran visualizar los registros que le corresponden de acuerdo a su proceso/area
		La app debe contar con todos los filtros posibles para consultar los  registros
		La app debe contar con las crads metrics posibles, deben contar con colores segun el tipo de datos, estas deben tener sombras y relieves para destacar la informacion
		La app debe contar con graficos y estadisticas, las tabkas deben tener sombras y relieves en los bordes, color diferente en las filas impares
		La app debe contar con las opciones tipo "CRUD" para la gestion de los registros por parte del perfil de coordinador
		La app debe crear tablas para los campos que sea tipo lista desplegable
		La app debe notificar via correo electronico al usuario asistencial que realizó una solicitud de cambio de turno con su respectivo ID en formato profesional de HTML
		La app debe notificar al Coordinador que le han solicitado un cambio de turno una persona de su grupo de trabajo con el respectivo ID en formato profesional y con un boton que lo lleve a la app
		Una vez el coordinador apruebe o niegue la solicitud, pesta debe ser notificada al usuario solicitante informandole del estado con su respectivo comentario.
		La app debe ser desplegada desde el momento inicial en Github
		La app debera crear un usuario administrador asi: usuario: juan.etayo@cacsantabarbara.co contraseña: admin123* nombres: Juan Carlos Etayo, rol: administrador
		
3.- Diligenciar a traves de un formulario por cada tipo de datos 
		El formulario debe contener: Los campos del archivo de Excel
		Se debe incluir un campo de observaciones
		El formulario de solicitud debe ser lo más profesional posible, que ocupe solo una pantalla sin que tengan que hacer scroll vertical
		
	
4.- Los datos deben quedar registrada en una tabla de la base de datos de Supabase (recuerda ya cuento con MCP de Supabase)
		La app debe mostrar los datos en una tabla de datos con modelo CRUD
		La app debe contener todos los filtros posibles
		Dashboard de metricas (tipo odoo.com)
		Filtros por año, mes, proceso/area, etc.
		Filtros todos los posibles
		Graficos, tablas con diseño tipo www.odoo.com

5.-  Utilizar el logo de la Clinica
		Utilizar colores relacionados con el logo
		Opcion de recuperacion de contraseña
		
6.- Reportes
	.- Todos los posibles
	.- Con opcion de exportar a Excel PDF
	.- Los archivos exportados deben contener titulos y logo de la Clínica
	

7.- La base de datos debe estar en Supabase

	Notas:
		Todas las tablas deben tener opcion (CRUD) para la gestion
		Se debe contemplar todas las opciones de permisos y accesos que requiera Supabase
		
8.- Resumen
		Se debe generar el super prompt basado en estas notas y todos los cambios que surgan del desarrollo
		Se debe contar con todo el codigo fuente de la aplicacion para futuros cambios o despligues en otro servidor e indicar la carpeta donde queda el codigo fuente
		Se deben generar todos los archivos .MD necesarios
		Se debe generar un informe de la estructura del proyecto
		Debes suministrar la ruta y nombre del archivo de este chat
	
9.- Antes de iniciar el proceso sugiero revises este prompt y has las sugerencias que consideres
