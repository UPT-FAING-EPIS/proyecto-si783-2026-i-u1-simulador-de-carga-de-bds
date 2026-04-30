export const clientes = [
  { id: 1, nombre: 'Juan Pérez',    email: 'juan@email.com',    ciudad: 'Madrid',    telefono: '+34 600 111 222' },
  { id: 2, nombre: 'María López',   email: 'maria@email.com',   ciudad: 'Barcelona', telefono: '+34 600 333 444' },
  { id: 3, nombre: 'Carlos Ruiz',   email: 'carlos@email.com',  ciudad: 'Valencia',  telefono: '+34 600 555 666' },
  { id: 4, nombre: 'Ana Torres',    email: 'ana@email.com',     ciudad: 'Sevilla',   telefono: '+34 600 777 888' },
  { id: 5, nombre: 'Luis Gómez',    email: 'luis@email.com',    ciudad: 'Bilbao',    telefono: '+34 600 999 000' },
  { id: 6, nombre: 'Carmen Silva',  email: 'carmen@email.com',  ciudad: 'Madrid',    telefono: '+34 600 112 233' },
  { id: 7, nombre: 'Pedro Martín',  email: 'pedro@email.com',   ciudad: 'Granada',   telefono: '+34 600 445 566' },
]

export const productos = [
  { id: 1,  nombre: 'Laptop Gamer',       precio: 1200.00, categoria: 'Electrónica',   stock: 15 },
  { id: 2,  nombre: 'Teclado Mecánico',   precio: 45.00,   categoria: 'Periféricos',   stock: 50 },
  { id: 3,  nombre: 'Mouse Inalámbrico',  precio: 25.00,   categoria: 'Periféricos',   stock: 80 },
  { id: 4,  nombre: 'Monitor 24"',        precio: 150.00,  categoria: 'Electrónica',   stock: 20 },
  { id: 5,  nombre: 'Auriculares',        precio: 80.00,   categoria: 'Audio',         stock: 35 },
  { id: 6,  nombre: 'Webcam HD',          precio: 60.00,   categoria: 'Periféricos',   stock: 25 },
  { id: 7,  nombre: 'SSD 1TB',            precio: 95.00,   categoria: 'Almacenamiento',stock: 40 },
  { id: 8,  nombre: 'RAM 16GB',           precio: 65.00,   categoria: 'Memoria',       stock: 30 },
  { id: 9,  nombre: 'Mousepad XL',        precio: 20.00,   categoria: 'Periféricos',   stock: 60 },
  { id: 10, nombre: 'Hub USB 4 puertos',  precio: 18.00,   categoria: 'Periféricos',   stock: 45 },
]

export const ordenes = [
  { id: 1,  id_cliente: 1, fecha: '2024-03-15', estado: 'Completado' },
  { id: 2,  id_cliente: 2, fecha: '2024-03-14', estado: 'Completado' },
  { id: 3,  id_cliente: 3, fecha: '2024-03-13', estado: 'Completado' },
  { id: 4,  id_cliente: 4, fecha: '2024-03-12', estado: 'Completado' },
  { id: 5,  id_cliente: 5, fecha: '2024-03-11', estado: 'Completado' },
  { id: 6,  id_cliente: 1, fecha: '2024-03-10', estado: 'Pendiente'  },
  { id: 7,  id_cliente: 6, fecha: '2024-03-09', estado: 'Pendiente'  },
  { id: 8,  id_cliente: 7, fecha: '2024-03-08', estado: 'Cancelado'  },
  { id: 9,  id_cliente: 2, fecha: '2024-03-07', estado: 'Completado' },
  { id: 10, id_cliente: 3, fecha: '2024-03-06', estado: 'Completado' },
]

export const orden_detalle = [
  { id: 1, id_orden: 1,  id_producto: 1,  cantidad: 1, precio_unitario: 1200.00 },
  { id: 2, id_orden: 2,  id_producto: 2,  cantidad: 2, precio_unitario: 45.00   },
  { id: 3, id_orden: 3,  id_producto: 3,  cantidad: 1, precio_unitario: 25.00   },
  { id: 4, id_orden: 4,  id_producto: 4,  cantidad: 1, precio_unitario: 150.00  },
  { id: 5, id_orden: 5,  id_producto: 5,  cantidad: 1, precio_unitario: 80.00   },
  { id: 6, id_orden: 6,  id_producto: 6,  cantidad: 1, precio_unitario: 60.00   },
  { id: 7, id_orden: 7,  id_producto: 8,  cantidad: 1, precio_unitario: 65.00   },
  { id: 8, id_orden: 9,  id_producto: 7,  cantidad: 1, precio_unitario: 95.00   },
  { id: 9, id_orden: 10, id_producto: 10, cantidad: 1, precio_unitario: 18.00   },
]

export const vistas = [
  { nombre: 'v_ordenes_completas',  descripcion: 'Órdenes con datos de cliente y productos' },
  { nombre: 'v_productos_stock',    descripcion: 'Productos con stock menor a 20 unidades'  },
  { nombre: 'v_clientes_activos',   descripcion: 'Clientes con al menos una orden completada'},
]

export const procedimientos = [
  { nombre: 'sp_procesar_orden',    descripcion: 'Procesa y valida una orden completa'  },
  { nombre: 'sp_actualizar_stock',  descripcion: 'Actualiza inventario tras venta'      },
  { nombre: 'sp_reporte_mensual',   descripcion: 'Genera reporte de ventas mensual'     },
]

export const funciones = [
  { nombre: 'fn_calcular_total',    descripcion: 'Calcula el total de una orden'        },
  { nombre: 'fn_descuento_cliente', descripcion: 'Calcula descuento para clientes VIP'  },
]
