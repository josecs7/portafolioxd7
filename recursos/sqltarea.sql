-- ==========================================
-- 1. CREACIÓN DE LAS TABLAS DE DIMENSIÓN
-- ==========================================

CREATE TABLE Dim_Tiempo (
    IdTiempo INT PRIMARY KEY,
    Fecha DATE,
    Anio INT,
    Mes INT,
    Trimestre INT
);

CREATE TABLE Dim_Producto (
    IdProducto INT PRIMARY KEY,
    NombreProducto VARCHAR(100),
    Categoria VARCHAR(50),
    PrecioUnitario DECIMAL(10, 2)
);

CREATE TABLE Dim_Cliente (
    IdCliente INT PRIMARY KEY,
    NombreCliente VARCHAR(100),
    Ciudad VARCHAR(50),
    TipoCliente VARCHAR(50)
);

CREATE TABLE Dim_Tienda (
    IdTienda INT PRIMARY KEY,
    NombreTienda VARCHAR(100),
    Region VARCHAR(50)
);

-- ==========================================
-- 2. CREACIÓN DE LA TABLA DE HECHOS
-- ==========================================

CREATE TABLE Hechos_Ventas (
    IdVenta INT PRIMARY KEY,
    IdTiempo INT,
    IdProducto INT,
    IdCliente INT,
    IdTienda INT,
    Cantidad INT,
    MontoTotal DECIMAL(10, 2),
    FOREIGN KEY (IdTiempo) REFERENCES Dim_Tiempo(IdTiempo),
    FOREIGN KEY (IdProducto) REFERENCES Dim_Producto(IdProducto),
    FOREIGN KEY (IdCliente) REFERENCES Dim_Cliente(IdCliente),
    FOREIGN KEY (IdTienda) REFERENCES Dim_Tienda(IdTienda)
);

-- ==========================================
-- 3. INSERCIÓN DE DATOS (10 REGISTROS POR TABLA)
-- ==========================================

-- Insertar 10 registros en Dim_Tiempo
INSERT INTO Dim_Tiempo (IdTiempo, Fecha, Anio, Mes, Trimestre) VALUES
(1, '2023-10-01', 2023, 10, 4),
(2, '2023-10-05', 2023, 10, 4),
(3, '2023-11-12', 2023, 11, 4),
(4, '2023-11-20', 2023, 11, 4),
(5, '2023-12-01', 2023, 12, 4),
(6, '2024-01-15', 2024, 1, 1),
(7, '2024-02-10', 2024, 2, 1),
(8, '2024-03-05', 2024, 3, 1),
(9, '2024-03-22', 2024, 3, 1),
(10, '2024-04-10', 2024, 4, 2);

-- Insertar 10 registros en Dim_Producto
INSERT INTO Dim_Producto (IdProducto, NombreProducto, Categoria, PrecioUnitario) VALUES
(1, 'Laptop Pro 15', 'Computación', 1200.00),
(2, 'Monitor 4K 27"', 'Periféricos', 350.00),
(3, 'Teclado Mecánico', 'Accesorios', 80.00),
(4, 'Ratón Inalámbrico', 'Accesorios', 45.00),
(5, 'Smartphone X', 'Telefonía', 800.00),
(6, 'Tablet Plus', 'Computación', 450.00),
(7, 'Auriculares Bluetooth', 'Audio', 120.00),
(8, 'Disco Duro Externo 2TB', 'Almacenamiento', 90.00),
(9, 'Memoria RAM 16GB', 'Componentes', 60.00),
(10, 'Cargador Inalámbrico', 'Accesorios', 30.00);

-- Insertar 10 registros en Dim_Cliente
INSERT INTO Dim_Cliente (IdCliente, NombreCliente, Ciudad, TipoCliente) VALUES
(1, 'Tech Solutions SAC', 'Lima', 'Corporativo'),
(2, 'Juan Pérez', 'Arequipa', 'Individual'),
(3, 'María Gómez', 'Cusco', 'Individual'),
(4, 'Innovación Digital', 'Lima', 'Corporativo'),
(5, 'Carlos Rojas', 'Trujillo', 'Individual'),
(6, 'Ana Silva', 'Piura', 'Individual'),
(7, 'Global Systems', 'Lima', 'Corporativo'),
(8, 'Luis Fernández', 'Huancayo', 'Individual'),
(9, 'Elena Castro', 'Iquitos', 'Individual'),
(10, 'Redes y Más EIRL', 'Lima', 'Corporativo');

-- Insertar 10 registros en Dim_Tienda
INSERT INTO Dim_Tienda (IdTienda, NombreTienda, Region) VALUES
(1, 'Tienda Central Lima', 'Costa'),
(2, 'Sucursal Norte', 'Costa'),
(3, 'Sucursal Sur', 'Costa'),
(4, 'Tienda Arequipa', 'Sierra'),
(5, 'Tienda Cusco', 'Sierra'),
(6, 'Tienda Huancayo', 'Sierra'),
(7, 'Tienda Trujillo', 'Costa'),
(8, 'Tienda Piura', 'Costa'),
(9, 'Tienda Iquitos', 'Selva'),
(10, 'Tienda Pucallpa', 'Selva');

-- Insertar 10 registros en Hechos_Ventas
-- (Se cruzan los IDs de las dimensiones anteriores)
INSERT INTO Hechos_Ventas (IdVenta, IdTiempo, IdProducto, IdCliente, IdTienda, Cantidad, MontoTotal) VALUES
(1, 1, 1, 1, 1, 2, 2400.00),
(2, 2, 5, 2, 4, 1, 800.00),
(3, 3, 2, 3, 5, 1, 350.00),
(4, 4, 3, 4, 1, 5, 400.00),
(5, 5, 7, 5, 7, 2, 2400.00),
(6, 6, 8, 6, 8, 1, 90.00),
(7, 7, 10, 7, 2, 10, 300.00),
(8, 8, 1, 8, 6, 1, 1200.00),
(9, 9, 6, 9, 9, 1, 450.00),
(10, 10, 4, 10, 3, 4, 180.00);
