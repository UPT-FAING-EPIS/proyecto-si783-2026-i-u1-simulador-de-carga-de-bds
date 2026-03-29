<center>

[comment]: <img src="./media/media/image1.png" style="width:1.088in;height:1.46256in" alt="escudo.png" />

![./media/media/image1.png](./media/logo-upt.png)

**UNIVERSIDAD PRIVADA DE TACNA**

**FACULTAD DE INGENIERIA**

**Escuela Profesional de Ingeniería de Sistemas**

**Proyecto *{Nombre de Proyecto}***

Curso: *CALIDAD Y PRUEBAS DE SOFTWARE*

Docente: *MAG.PATRICK CUADROS QUIROGA*

Integrantes:

***Vargas Luque, Jhony             (2019065026)***  
***Abel Fernando Pacompía Ortiz   (2023076797)***

**Tacna – Perú**

***2026***

</center>
<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

Sistema *SimCargaDB*

Informe de Factibilidad

Versión *{1.0}*

|CONTROL DE VERSIONES||||||
| :-: | :- | :- | :- | :- | :- |
|Versión|Hecha por|Revisada por|Aprobada por|Fecha|Motivo|
|1\.0|MPV|ELV|ARV|10/10/2020|Versión Original|

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

# **INDICE GENERAL**

[1. Descripción del Proyecto](#_Toc52661346)

[2. Riesgos](#_Toc52661347)

[3. Análisis de la Situación actual](#_Toc52661348)

[4. Estudio de Factibilidad](#_Toc52661349)

[4.1 Factibilidad Técnica](#_Toc52661350)

[4.2 Factibilidad económica](#_Toc52661351)

[4.3 Factibilidad Operativa](#_Toc52661352)

[4.4 Factibilidad Legal](#_Toc52661353)

[4.5 Factibilidad Social](#_Toc52661354)

[4.6 Factibilidad Ambiental](#_Toc52661355)

[5. Análisis Financiero](#_Toc52661356)

[6. Conclusiones](#_Toc52661357)


<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

**<u>Informe de Factibilidad</u>**

1. <span id="_Toc52661346" class="anchor"></span>**Descripción del Proyecto**

    1.1. Nombre del proyecto
   
SimCargaDB

    1.2. Duración del proyecto
    
El proyecto tiene una duracion de 4 semanas (1 mes)

    1.3. Descripción

El proyecto SimCargaDB consiste en el desarrollo de un sistema que permite simular la carga de trabajo en bases de datos, con el objetivo de analizar su comportamiento y rendimiento ante múltiples solicitudes.

Este proyecto se realiza en el contexto académico universitario, como parte del aprendizaje en el área de sistemas y desarrollo de software. Su propósito es aplicar conocimientos teóricos en una solución práctica que permita comprender mejor el funcionamiento de las bases de datos en escenarios de uso real.

Además, busca aportar una herramienta básica que facilite la evaluación del rendimiento de sistemas, permitiendo identificar posibles mejoras y optimizaciones.

    1.4. Objetivos

        1.4.1 Objetivo general

Desarrollar un sistema simulador de carga de bases de datos que permita ejecutar operaciones concurrentes y analizar el rendimiento mediante métricas y reportes.

        1.4.2 Objetivos Específicos
        
- Implementar la conexión a bases de datos (MySQL y PostgreSQL)  
- Desarrollar la simulación de usuarios virtuales y ejecución concurrente  
- Implementar operaciones de carga (SELECT, INSERT, UPDATE, DELETE)  
- Registrar métricas de rendimiento y tiempos de ejecución  
- Generar reportes y visualización de resultados  
- Realizar pruebas del sistema y validar su funcionamiento 
            
            Para cada objetivo específico se indicara que se va a lograr

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

2. <span id="_Toc52661347" class="anchor"></span>**Riesgos**

2.1. Limitaciones técnicas

Durante el desarrollo del proyecto SimCargaDB, se identifican los siguientes riesgos:

- Fallas en la conexión a la base de datos  
- Limitaciones de hardware  
- Errores en la ejecución concurrente  
- Sobrecarga del sistema durante las pruebas  
- Falta de experiencia en herramientas o tecnologías  
- Problemas en la medición de métricas  
- Tiempo limitado de desarrollo  


2.2. Limitaciones de tiempo

El tiempo asignado para el desarrollo puede no ser suficiente para implementar todas las funcionalidades previstas o realizar pruebas exhaustivas.

2.3. Recursos limitados

La falta de equipos adecuados o acceso restringido a redes reales puede dificultar las pruebas del sistema en escenarios reales.







<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

3. <span id="_Toc52661348" class="anchor"></span>**Análisis de la Situación actual**

    3.1. Planteamiento del problema

En la actualidad, muchas aplicaciones que utilizan bases de datos no cuentan con mecanismos adecuados para evaluar su rendimiento antes de ser implementadas en entornos reales. Esto genera problemas como lentitud en las consultas, caídas del sistema y una mala experiencia para los usuarios finales.
Generalmente, las pruebas realizadas son limitadas o no representan escenarios reales de alta concurrencia, lo que dificulta identificar fallas relacionadas con el manejo de múltiples solicitudes simultáneas.
Ante esta situación, surge la necesidad de desarrollar una herramienta que permita simular cargas de trabajo sobre bases de datos, con el fin de analizar su comportamiento, medir su rendimiento y detectar posibles deficiencias antes de su uso en producción.


    3.2. Consideraciones de hardware y software

 ### 💻 Hardware requerido

| Recurso             | Especificación                         | Descripción                                                                 |
|---------------------|----------------------------------------|-----------------------------------------------------------------------------|
| Computadora         | PC o laptop                           | Equipo principal para desarrollo y pruebas                                  |
| Procesador          | Intel Core i5 o equivalente            | Permite ejecutar simulaciones de carga de manera eficiente                  |
| Memoria RAM         | 8 GB mínimo                            | Necesaria para ejecutar múltiples procesos concurrentes                     |
| Almacenamiento      | 256 GB o superior                      | Espacio para sistema y ejecución de pruebas                                 |
| Conexión a internet | Acceso estable                         | Necesaria para instalación de herramientas y pruebas                        |

---

### 🧰 Software requerido

| Software             | Tipo / Versión        | Propósito                                      |
|----------------------|----------------------|------------------------------------------------|
| Sistema operativo    | Windows o Linux       | Ejecución del sistema                          |
| Lenguaje             | Java o Python         | Desarrollo del simulador                       |
| Framework (opcional) | Spring Boot           | Desarrollo backend (si se usa Java)            |
| Base de datos        | MySQL / PostgreSQL    | Pruebas de carga                              |
| IDE                  | NetBeans / VS Code    | Desarrollo del sistema                         |
| Navegador web        | Google Chrome         | Visualización de resultados                    |



4. <span id="_Toc52661349" class="anchor"></span>**Estudio de
    Factibilidad**

Describir los resultados que esperan alcanzar del estudio de factibilidad, las actividades que se realizaron para preparar la evaluación de factibilidad y por quien fue aprobado.

    4.1.Factibilidad Técnica

El estudio de viabilidad técnica se enfoca en obtener un entendimiento de los recursos tecnológicos disponibles actualmente y su aplicabilidad a las necesidades que se espera tenga el proyecto. En el caso de tecnología informática esto implica una evaluación del hardware y software y como este puede cubrir las necesidades del sistema propuesto.
Realizar una evaluación de la tecnología actual existente y la posibilidad de utilizarla en el desarrollo e implantación del sistema.*
Describir acerca del hardware (equipos, servidor), software (aplicaciones, navegadores, sistemas operativos, dominio, internet, infraestructura de red física, etc.

El sistema será desarrollado utilizando tecnologías accesibles como:
- Lenguaje: Python 3
- Librería de red: Scapy
- IDE: Visual Studio Code
- Gestión del desarrollo: GitHub Issues

El uso de Python permite una implementación rápida y eficiente del sistema IDS, facilitando la captura y análisis de paquetes de red en tiempo real.

El entorno Visual Studio Code permite una integración eficiente con Python, facilitando la depuración, ejecución y organización del proyecto.

    4.2.Factibilidad Económica

El propósito del estudio de viabilidad económica, es determinar los beneficios económicos del proyecto o sistema propuesto para la organización, en contraposición con los costos.
Como se mencionó anteriormente en el estudio de factibilidad técnica wvaluar si la institución (departamento de TI) cuenta con las herramientas necesarias para la implantación del sistema y evaluar si la propuesta requiere o no de una inversión inicial en infraestructura informática.

Se plantearán los costos del proyecto.
Costeo del Proyecto: Consiste en estimar los costos de los recursos Humanos, materiales o consumibles y/o máquinas) directos para completar las actividades del proyecto}.*
Definir los siguientes costos:

        4.2.1. Costos Generales


| Ítem                     | Descripción                              | Cantidad | Costo Unitario (S/.) | Costo Total (S/.) |
|--------------------------|------------------------------------------|----------|----------------------|------------------|
| Laptop / Computadora     | Equipo de desarrollo (recurso propio)    | 1        | 0.00                 | 0.00             |
| Cuadernos / hojas        | Material para apuntes y documentación    | 2        | 15.00                | 30.00            |
| Lapiceros                | Material de escritura                    | 5        | 2.00                 | 10.00            |
| Impresiones              | Documentos del proyecto                  | 100      | 0.10                 | 10.00            |
| Cartucho de tinta        | Impresora                               | 1        | 80.00                | 80.00            |
| Marcadores               | Presentaciones y esquemas                | 3        | 5.00                 | 15.00            |
| Internet                 | Servicio mensual                        | 1        | 80.00                | 80.00            |
| Energía eléctrica        | Consumo durante desarrollo              | 1        | 50.00                | 50.00            |
| **TOTAL**                |                                          |          |                      | **275.00**       |
        4.2.2. Costos operativos durante el desarrollo 
        
                Evaluar costos necesarios para la operatividad de las actividades de la empresa durante el periodo en el que se realizara el proyecto. Los costos de operación pueden ser renta de oficina, agua, luz, teléfono, etc.

        4.2.3. Costos del ambiente

| Ítem                | Descripción                              | Cantidad | Costo Mensual (S/.) | Costo Total (S/.) |
|---------------------|------------------------------------------|----------|---------------------|------------------|
| Internet            | Servicio de conexión a internet          | 1        | 80.00               | 80.00            |
| Energía eléctrica   | Consumo durante desarrollo               | 1        | 50.00               | 50.00            |
| Agua                | Consumo básico                           | 1        | 20.00               | 20.00            |
| Espacio de trabajo  | Uso de ambiente propio (sin alquiler)    | 1        | 0.00                | 0.00             |
| **TOTAL**           |                                          |          |                     | **150.00**       |


        4.2.4. Costos de personal

| Rol              | Cantidad | Horas Totales | Costo por Hora (S/.) | Costo Total (S/.) |
|------------------|----------|---------------|----------------------|------------------|
| Desarrollador 1  | 1        | 80            | 10.00                | 800.00           |
| Desarrollador 2  | 1        | 80            | 10.00                | 800.00           |
| **TOTAL**        |          |               |                      | **1600.00**      |

        4.2.5.  Costos totales del desarrollo del sistema

| Tipo de Costo        | Descripción                                      | Costo Total (S/.) |
|----------------------|--------------------------------------------------|------------------|
| Costos Generales     | Materiales de oficina y recursos básicos         | 275.00           |
| Costos Operativos    | Servicios básicos durante 1 mes                  | 150.00           |
| Costos de Personal   | Desarrollo del sistema (2 personas)              | 1600.00          |
| **TOTAL GENERAL**    |                                                  | **2025.00**      |

    4.3.Factibilidad Operativa

En el presente proyecto, el sistema básico de detección de intrusos (IDS) será implementado en modo de prueba en la Universidad Privada de Tacna, específicamente en un entorno académico controlado. Esta implementación permitirá evaluar su funcionamiento sin afectar la operatividad real de la red institucional.

Beneficios del Sistema

La implementación del IDS en un entorno de prueba proporcionará los siguientes beneficios:

-Mejora en la detección de posibles amenazas en la red
-Generación de alertas ante actividades sospechosas
-Monitoreo del tráfico de red en tiempo real
-Apoyo en el aprendizaje práctico de seguridad informática
-Reducción de costos al utilizar herramientas de código abierto

Capacidad Operativa del Usuario

El sistema será utilizado por estudiantes y desarrollado con fines académicos, por lo que:

Puede ser operado con conocimientos básicos de redes
No requiere personal altamente especializado
Su uso será supervisado por el docente del curso
Se ejecutará en equipos personales dentro de la red de prueba

Mantenimiento del Sistema

El mantenimiento del sistema durante la fase de prueba será mínimo y estará a cargo de los desarrolladores (estudiantes), incluyendo:

Actualización de reglas de detección
Revisión de registros (logs)
Verificación del correcto funcionamiento


    4.4.Factibilidad Legal

**Licencias de software**

El sistema IDS será desarrollado utilizando tecnologías de código abierto, principalmente el lenguaje de programación Python y librerías como Scapy, las cuales cuentan con licencias permisivas compatibles con el uso académico y la distribución open-source.

Asimismo, se emplearán herramientas como Visual Studio Code, Git y GitHub, que permiten el desarrollo y gestión del proyecto sin restricciones legales.

No existe conflicto de licencias para la publicación del proyecto bajo licencias abiertas como MIT o Apache 2.0, ya que todas las tecnologías utilizadas permiten su libre uso, modificación y distribución.

---

**Protección de datos**

El sistema IDS operará en un entorno local o red controlada, realizando el monitoreo del tráfico de red en tiempo real.

No se almacenarán datos personales sensibles ni se transmitirá información confidencial a servidores externos. El análisis se limita a información técnica como:

- Direcciones IP  
- Puertos  
- Protocolos de red  

Estos datos serán utilizados únicamente con fines académicos y de detección de intrusiones.

Además, el sistema será implementado en un entorno de prueba, evitando afectar redes reales o información privada.

---

**Uso del sistema y ética**

El sistema IDS será utilizado exclusivamente con fines académicos dentro de un entorno controlado.

No se empleará para actividades maliciosas ni para la interceptación indebida de comunicaciones. Su finalidad es:

- Monitorear el tráfico de red  
- Detectar posibles amenazas  
- Apoyar el aprendizaje en seguridad informática  

El uso del sistema se realizará respetando principios éticos y normas de uso responsable de la tecnología.

---

**Propiedad intelectual**

El software desarrollado constituye una contribución académica original elaborada por los estudiantes.

No se incorporará código propietario ni herramientas comerciales restringidas. El sistema será desarrollado utilizando tecnologías open-source permitidas.

---

**Evaluación**

No existen impedimentos legales para el desarrollo, implementación ni uso del sistema IDS en el contexto académico.

**La factibilidad legal del proyecto es ALTA**, debido a:

- Uso de tecnologías open-source  
- Operación en entorno controlado  
- Respeto de principios éticos  
- Ausencia de conflictos de licencias

---

    4.5.Factibilidad Social 

El proyecto tiene un impacto social positivo en el ámbito académico y en la comunidad de desarrollo de software. Al tratarse de una herramienta open-source, cualquier estudiante, desarrollador o institución puede utilizar el sistema IDS sin costo, contribuyendo a mejorar la cultura de seguridad informática.

En el contexto global, el proyecto promueve el aprendizaje en ciberseguridad, un área de alta demanda, permitiendo a los desarrolladores comprender cómo detectar amenazas en redes mediante herramientas accesibles como Python y Scapy.

En el contexto local, el proyecto representa una aplicación práctica de los conocimientos adquiridos durante la formación universitaria, sirviendo como referencia para futuros estudiantes de Ingeniería de Sistemas. La publicación del proyecto en GitHub fomenta buenas prácticas como:

- Desarrollo colaborativo  
- Documentación técnica  
- Uso de control de versiones  
- Gestión de tareas mediante Issues  

No se identifican impactos negativos de índole social, cultural o ético, ya que:

- No se recopilan datos personales sensibles  
- No se restringe el acceso a usuarios  
- No promueve prácticas discriminatorias  
- Se utiliza únicamente en entornos controlados con fines académicos  

**Evaluación:** El proyecto tiene un impacto social positivo y no presenta conflictos éticos.**La factibilidad social es ALTA.**

    4.6.Factibilidad Ambiental

El proyecto consiste en una herramienta de software sin componentes físicos ni procesos industriales, por lo que su impacto ambiental es mínimo.

Se consideran los siguientes aspectos:

- **Consumo energético:** El desarrollo y ejecución del sistema se realizan en equipos personales. El consumo adicional de energía es bajo y no representa un impacto significativo.

- **Infraestructura digital:** El uso de plataformas como GitHub para almacenamiento y control de versiones implica el uso de servicios en la nube, los cuales operan bajo políticas de eficiencia energética y sostenibilidad.

- **Distribución digital:** El sistema IDS se distribuye exclusivamente en formato digital (código fuente en GitHub), evitando el uso de materiales físicos y la generación de residuos.

- **Ausencia de impacto industrial:** El proyecto no involucra procesos de manufactura, transporte ni uso de recursos naturales.

**Evaluación:** El impacto ambiental del proyecto es mínimo y no presenta conflictos ambientales.**La factibilidad ambiental es ALTA.**





5. **Análisis Financiero**

El plan financiero se ocupa del análisis de ingresos y gastos asociados a cada proyecto, desde el punto de vista del instante temporal en que se producen. Su misión fundamental es detectar situaciones financieramente inadecuadas.
Se tiene que estimar financieramente el resultado del proyecto.

    5.1. Justificación de la Inversión

Dado que el sistema IDS es una herramienta open-source de uso académico, el retorno de la inversión no se mide en ingresos económicos directos, sino en beneficios tangibles e intangibles para los usuarios y la institución.

        5.1.1. Beneficios del Proyecto

| Beneficio | Estimación |
|----------|-----------|
| Reducción del tiempo de monitoreo manual de red | De varias horas a monitoreo automático en tiempo real |
| Detección automática de actividades sospechosas | Cobertura continua vs. 0% sin sistema IDS |
| Eliminación de costos de herramientas comerciales de seguridad | Ahorro de USD 20–50/mes por usuario |
| Implementación sin necesidad de hardware adicional | Uso de equipos existentes |
| Prevención de incidentes de seguridad | Reducción de riesgos de pérdida de información |


### Beneficios Intangibles
- Mejora de la cultura de seguridad informática en entornos académicos  
- Desarrollo de habilidades en redes y ciberseguridad  
- Aplicación práctica de conocimientos teóricos  
- Contribución académica de la Universidad  
- Disponibilidad de una herramienta open-source accesible  
- Fortalecimiento del perfil profesional de los desarrolladores  
- Publicación del proyecto en GitHub como evidencia técnica  



        
        5.1.2. Criterios de Inversión

Dado el carácter académico del proyecto, el análisis financiero se basa en el ahorro generado frente al uso de herramientas comerciales de seguridad.
Se considera un escenario de referencia con 2 usuarios que podrían utilizar herramientas equivalentes de pago.


### Parámetros del análisis

| Parámetro | Valor |
|----------|------|
| Inversión total del proyecto | S/. 2025.00 |
| Ahorro mensual estimado (2 usuarios × S/. 120) | S/. 240.00 |
| Tasa de descuento mensual (12% anual) | 1% |
| Horizonte de evaluación | 12 meses |

            5.1.2.1. Relación Beneficio/Costo (B/C)

Beneficio total en 12 meses:

            S/. 240 × 12 = S/. 2880.00  
            
            B/C = Beneficios / Costo  
            B/C = 2880 / 2025  
            B/C = **1.42**

Como **B/C > 1**, el proyecto es viable.

            5.1.2.2. Valor Actual Neto (VAN)
            
            VAN = -2025 + Σ [240 / (1 + 0.01)^t] para t = 1..12  
            
            VAN ≈ -2025 + 240 × 11.25  
            VAN ≈ -2025 + 2700  
            VAN ≈ **S/. 675.00**

Como **VAN > 0**, el proyecto se acepta.


            5.1.2.3 Tasa Interna de Retorno (TIR)*

Debido a que la inversión es relativamente baja frente a los beneficios estimados, la TIR es positiva y superior al costo de oportunidad del capital.

Sin embargo, al tratarse de un proyecto académico, se prioriza la evaluación mediante B/C y VAN.


### Resumen del análisis financiero

| Indicador | Resultado | Decisión |
|----------|----------|----------|
| Relación B/C | 1.42 | Aceptado |
| VAN | S/. 675.00 | Aceptado |
| TIR | Positiva | Referencial |

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

6. <span id="_Toc52661357" class="anchor"></span>**Conclusiones**

El análisis de factibilidad realizado sobre el proyecto **Sistema de Detección de Intrusos (IDS) para monitoreo de tráfico de red** arroja resultados positivos en todas las dimensiones evaluadas:

1. **Factibilidad Técnica:** El proyecto es técnicamente viable. El stack tecnológico utilizado (Python, Scapy, Visual Studio Code, GitHub) es accesible, open-source y ampliamente documentado. No se requiere inversión en infraestructura adicional, ya que el sistema puede ejecutarse en equipos de cómputo convencionales.

2. **Factibilidad Económica:** El costo total del proyecto asciende a **S/. 2025.00**, correspondiente principalmente a costos de desarrollo y recursos básicos. Los beneficios obtenidos, tanto en ahorro de herramientas de seguridad como en prevención de incidentes, superan los costos, lo que demuestra la viabilidad económica del sistema.

3. **Factibilidad Operativa:** El sistema responde a una necesidad real en entornos académicos, permitiendo el monitoreo del tráfico de red y la detección de actividades sospechosas. Su implementación es sencilla y puede ser utilizada por estudiantes con conocimientos básicos, facilitando su adopción y mantenimiento.

4. **Factibilidad Legal:** No existen impedimentos legales. Todas las tecnologías utilizadas cuentan con licencias open-source compatibles. El sistema opera en entornos controlados, sin comprometer datos personales ni infringir normativas de privacidad.

5. **Factibilidad Social y Ambiental:** El proyecto tiene un impacto social positivo al fomentar la cultura de seguridad informática y el desarrollo de soluciones tecnológicas accesibles. El impacto ambiental es mínimo, ya que se trata de software puro distribuido digitalmente sin generación de residuos físicos.

6. **Análisis Financiero:** Los indicadores evaluados (**B/C = 1.42 y VAN = S/. 675.00**) superan los criterios de aceptación. La TIR es positiva, aunque de carácter referencial debido al enfoque académico del proyecto.

**En conclusión, el proyecto IDS es viable y factible desde todas las perspectivas analizadas, y se recomienda su desarrollo e implementación como una solución funcional y formativa en el ámbito de la seguridad informática.**
