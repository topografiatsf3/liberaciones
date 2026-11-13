# Genera un Excel de protocolos INVENTADO con las mismas columnas que el «Log» mensual de la obra.
# No usa ningún dato real: códigos, fechas, progresivas y nombres son de prueba.
# Uso: python3 generar_excel.py  → excel-prueba.xlsx
import os, datetime
from openpyxl import Workbook

CAB = ['ITEM', 'N° Registro', 'Key_Topografo', 'Descripcion', 'Km Inicio', 'Km Fin', 'Fecha Liberacion', 'Fecha de entrega',
       'Estructura', 'Sub-Estructura', 'Elemento', 'Tipo de Liberacion', 'Generado']
D = lambda d: datetime.datetime(2026, 1, d)
MT = 'Movimiento de tierras '  # con el espacio de más, como viene en el Excel de obra
FILAS = [
    # código, clave, descripción, km inicio, km fin, fecha lib., fecha entrega, estructura, frente, elemento, tipo
    (2800, 'CS', 'Superficie de terreno nivelado de prueba', 100, 140, D(5), D(6), 'Presa Principal', 'Presa Principal Oeste', MT, 'Superficie Terreno Nivelado'),
    (2801, 'CS', 'Liberacion de Relleno masivo compactado Capa:12 Cota: Variable Presa principal Oeste', 140, 180, D(5), D(6), 'Presa Principal', 'Presa Principal Oeste', MT, 'Relleno masivo'),
    (2802, 'CS', 'Superficie de terreno nivelado para despliegue de Geomembrana (prueba)', 180, 220, D(6), D(7), 'Presa Principal', 'Presa Principal Oeste', MT, 'Despliegue de Geomembrana'),
    (2803, 'GN', 'Liberacion de Relleno en zanja de anclaje (prueba)', 300, 380.5, D(6), D(7), 'Presa Principal', 'Presa Principal Este', MT, 'Relleno en zanja'),
    (2804, 'GN', 'Zona de roca de prueba', 32, 64, D(7), D(8), 'Presa Principal', 'Frente Inventado', MT, 'Zona de roca'),
    (2805, '', 'Liberacion de ubicacion final de caseta (prueba)', 'N/A', 'N/A', D(7), D(7), 'Casetas de monitoreo', 'Caseta 01', 'Instrumentación', 'Ubicación'),
    (2806, 'QX', 'Superficie de terreno nivelado de prueba', 220, 260, D(8), D(9), 'Presa Principal', 'Presa Principal Oeste', MT, 'Superficie Terreno Nivelado'),
    (2807, 'CS', 'Mismo código que uno registrado en la app', 600, 640, D(8), D(9), 'Presa Principal', 'Presa Principal Oeste', MT, 'Superficie Terreno Nivelado'),
    (2808, 'CS', 'Mismo código que un importado ya entregado en la app', 100, 150, D(9), D(10), 'Presa Principal', 'Presa Principal Oeste', MT, 'Superficie Terreno Nivelado'),
    (2809, 'CS', 'Mismo código que un importado sin tocar', 260, 300, D(9), D(10), 'Presa Principal', 'Presa Principal Oeste', MT, 'Superficie Terreno Nivelado'),
    (2810, 'CS', 'Todavía sin entrega', 300, 340, D(10), None, 'Presa Principal', 'Presa Principal Oeste', MT, 'Superficie Terreno Nivelado'),
    (None, 'CS', 'Fila sin código (no se carga)', 1, 2, D(10), D(10), 'Presa Principal', 'Presa Principal Oeste', MT, 'Superficie Terreno Nivelado'),
]
wb = Workbook(); ws = wb.active; ws.title = 'Hoja1'; ws.append(CAB)
for i, f in enumerate(FILAS):
    cod = f[0]
    ws.append([cod + 2 if cod else None, 'SKT-TOP-%05d' % cod if cod else None, f[1] or None, f[2], f[3], f[4], f[5], f[6], f[7], f[8], f[9], f[10], 'Gabinete prueba'])
for c in ('G', 'H'):
    for cel in ws[c][1:]: cel.number_format = 'dd/mm/yyyy'
wb.save(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'excel-prueba.xlsx'))
print(len(FILAS), 'filas inventadas')
