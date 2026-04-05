<center>

[comment]: <img src="./media/media/image1.png" style="width:1.088in;height:1.46256in" alt="escudo.png" />

![./media/media/image1.png](./media/logo-upt.png)

**UNIVERSIDAD PRIVADA DE TACNA**

**FACULTAD DE INGENIERIA**

**Escuela Profesional de Ingeniería de Sistemas**

**Proyecto *SimCargaDB***

Curso: *BASE DE DATOS II*

Docente: *MAG.PATRICK CUADROS QUIROGA*

Integrantes:

***Vargas Luque, Jhony             (2019065026)***  
***Abel Fernando Pacompía Ortiz   (2023076797)***

**Tacna – Perú**

***2026***

</center>
<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

Sistema *Simulación de carga de bds*

Informe de Factibilidad

Versión *{1.0}*

|CONTROL DE VERSIONES||||||
| :-: | :- | :- | :- | :- | :- |
|Versión|Hecha por|Revisada por|Aprobada por|Fecha|Motivo|
|1\.0|MPV|ELV|ARV|20/03/2020|Versión Original|

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

El estudio de factibilidad del proyecto SimCargaDB tiene como propósito determinar la viabilidad de su desarrollo considerando los aspectos técnicos, económicos y operativos involucrados. A partir del análisis realizado, se concluye que el proyecto es factible, debido a que se cuenta con los recursos tecnológicos necesarios, conocimientos adecuados para su implementación y un alcance coherente con el tiempo establecido de desarrollo.
En relación con los resultados esperados, se busca confirmar que el sistema puede ser desarrollado utilizando herramientas accesibles, validar la pertinencia de las tecnologías seleccionadas y asegurar que los costos asociados al proyecto sean mínimos y asumibles dentro de un entorno académico. Asimismo, se pretende garantizar que el sistema pueda ser implementado sin mayores limitaciones en el contexto universitario.
Para la elaboración del presente estudio, se llevaron a cabo diversas actividades, entre las cuales destacan el análisis de los requerimientos del sistema, la evaluación del hardware y software disponibles, la selección de tecnologías apropiadas para el desarrollo, la estimación del tiempo necesario para la ejecución del proyecto, así como la identificación de riesgos potenciales y el análisis preliminar de costos.
Finalmente, el estudio de factibilidad ha sido evaluado y aprobado en el marco del desarrollo académico del proyecto, considerando que cumple con los criterios necesarios para su ejecución, tanto en términos técnicos como económicos y operativos.


    4.1.Factibilidad Técnica

La factibilidad técnica del proyecto SimCargaDB se centra en evaluar la disponibilidad y adecuación de los recursos tecnológicos necesarios para su desarrollo e implementación. Este análisis permite determinar si la tecnología existente es suficiente para cubrir los requerimientos del sistema propuesto.

En el contexto del proyecto, se dispone de equipos de cómputo con características adecuadas, tales como procesadores de gama media, memoria RAM suficiente (mínimo 8 GB) y capacidad de almacenamiento que permite el desarrollo y ejecución de pruebas de carga. No se requiere el uso de servidores dedicados, ya que el sistema puede ser implementado en entornos locales o académicos sin mayores exigencias de infraestructura.

En cuanto al software, se cuenta con herramientas de desarrollo accesibles y ampliamente utilizadas, como lenguajes de programación (Java o Python), entornos de desarrollo integrados (NetBeans o Visual Studio Code), y sistemas gestores de bases de datos como MySQL y PostgreSQL. Asimismo, se dispone de sistemas operativos compatibles (Windows o Linux) y navegadores web actualizados que permiten la interacción con el sistema.

Respecto a la infraestructura de red, se considera suficiente una conexión a internet estable para la instalación de herramientas, pruebas básicas y posibles integraciones. No se requiere una red compleja ni configuraciones avanzadas para el funcionamiento del sistema en su etapa académica.

En base a lo anterior, se concluye que el proyecto es técnicamente viable, ya que los recursos disponibles son adecuados y suficientes para el desarrollo e implementación del sistema sin necesidad de inversiones adicionales en infraestructura tecnológica.


El sistema será desarrollado utilizando tecnologías accesibles como:
- Lenguaje: Python o Java
- IDE: Visual Studio Code
- Gestión del desarrollo: GitHub Issues

El entorno Visual Studio Code permite una integración eficiente con Python, facilitando la depuración, ejecución y organización del proyecto.

    4.2.Factibilidad Económica

La factibilidad económica del proyecto SimCargaDB tiene como propósito evaluar los costos asociados a su desarrollo en comparación con los beneficios que este puede generar en un entorno académico y tecnológico. En este sentido, el proyecto presenta una viabilidad económica favorable, ya que no requiere una inversión significativa en infraestructura, debido al uso de herramientas de desarrollo gratuitas y recursos tecnológicos disponibles.
Asimismo, se ha considerado que la institución o entorno académico cuenta con los medios necesarios para la implementación del sistema, por lo que no es necesario realizar inversiones adicionales en hardware o software especializado. El desarrollo del proyecto se enfoca principalmente en el uso de recursos humanos y costos operativos básicos.

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
        
Estos costos corresponden a los gastos necesarios para la ejecución del proyecto durante el periodo de desarrollo.

| Concepto | Costo |
|---------|------|
| Internet | 80 |
| Energía | 100 |
| Total | 180 |


        4.2.3. Costos del ambiente

| Recurso             | Detalle del gasto                         | Unidades | Costo mensual (S/.) | Subtotal (S/.) |
|---------------------|-------------------------------------------|----------|---------------------|----------------|
| Conexión a internet | Servicio necesario para desarrollo        | 1        | 80.00               | 80.00          |
| Consumo eléctrico   | Uso de energía durante el proyecto        | 1        | 50.00               | 50.00          |
| Servicio de agua    | Consumo básico del entorno                | 1        | 20.00               | 20.00          |
| Área de trabajo     | Espacio propio sin costo de alquiler      | 1        | 0.00                | 0.00           |
| **TOTAL**           |                                           |          |                     | **150.00**     |


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

La factibilidad operativa del proyecto SimCargaDB se enfoca en determinar la capacidad del entorno académico y de los usuarios para utilizar, mantener y aprovechar el sistema propuesto. En este sentido, el proyecto presenta una alta viabilidad operativa, ya que ha sido diseñado considerando herramientas accesibles, facilidad de uso y requerimientos técnicos básicos.
El sistema permitirá simular cargas de trabajo en bases de datos, lo cual representa un beneficio importante para el análisis del rendimiento y la detección de posibles fallas antes de la implementación de sistemas en entornos reales. De esta manera, contribuye a mejorar la calidad del software, optimizar el uso de recursos y fortalecer los procesos de desarrollo y pruebas.
Asimismo, el sistema ha sido planteado para ser utilizado en un contexto académico, por lo que los usuarios (estudiantes o desarrolladores) cuentan con los conocimientos necesarios para su manejo básico. Además, el mantenimiento del sistema no requiere procesos complejos, ya que se basa en tecnologías conocidas y documentación accesible.
En cuanto al impacto, el proyecto favorece el aprendizaje práctico, permite la experimentación con escenarios reales de carga y contribuye al desarrollo de competencias en áreas como bases de datos, programación y análisis de sistemas.

***Lista de interesados***
- Estudiante desarrollador del proyecto
- Docente del curso (asesor o evaluador)
- Compañeros de clase que puedan utilizar el sistema para pruebas
- Usuarios académicos (estudiantes de cursos de bases de datos o programación)
- Institución educativa (universidad)
- Estudiante desarrollador del proyecto



       4.4.Factibilidad Legal

El proyecto SimCargaDB cumple con la normativa vigente aplicable en el contexto académico y tecnológico, garantizando que su desarrollo y uso no infringe disposiciones legales relacionadas con la protección de datos, propiedad intelectual y uso de software.

| Aspecto                | Detalle |
|------------------------|--------|
| Normativa              | Cumplimiento de la Ley N.º 29733 de Protección de Datos Personales en el Perú, al no utilizar datos reales sino simulados. |
| Consentimiento         | No se requiere consentimiento de usuarios, debido a que el sistema no maneja información personal real. |
| Licencias              | Uso de software y tecnologías open-source como Java/Python, MySQL y PostgreSQL, compatibles con uso académico y sin restricciones legales. |
| Propiedad Intelectual  | El código fuente y documentación son desarrollados por los autores del proyecto, respetando normas académicas y evitando el plagio. |
| Contratos              | No aplica formalmente, debido a que el proyecto es académico; sin embargo, se respetan principios de confidencialidad y uso responsable de la información. |



    4.5.Factibilidad Social 

El proyecto SimCargaDB tiene un impacto positivo en el ámbito académico, ya que contribuye al fortalecimiento del aprendizaje práctico en áreas relacionadas con bases de datos, desarrollo de software y análisis de sistemas. Permite a los estudiantes y usuarios comprender de manera más clara el comportamiento de las bases de datos bajo condiciones reales de carga.


| Aspecto              | Detalle |
|----------------------|--------|
| Acceso               | Facilita el acceso a herramientas de simulación de bases de datos para estudiantes y desarrolladores en entornos académicos. |
| Eficiencia           | Mejora el aprendizaje práctico al permitir evaluar el rendimiento de sistemas sin necesidad de entornos complejos o costosos. |
| Transparencia        | Proporciona métricas claras y resultados verificables que permiten un análisis objetivo del comportamiento de las bases de datos. |
| Beneficio comunitario| Contribuye a la formación académica, fortaleciendo las competencias técnicas de los estudiantes y futuros profesionales. |
| Indicadores          | Mejora en el aprendizaje práctico, incremento en la comprensión de pruebas de carga, y mayor capacidad para optimizar sistemas de bases de datos. |





    4.6.Factibilidad Ambiental

El proyecto SimCargaDB contribuye de manera positiva al cuidado del medio ambiente al promover el uso de herramientas digitales para la simulación y análisis de bases de datos, evitando la necesidad de documentación física. Al tratarse de un sistema desarrollado y ejecutado en entornos virtuales, se reduce significativamente el consumo de papel y otros recursos materiales.


| Aspecto            | Detalle |
|--------------------|--------|
| Reducción de papel | Se elimina la necesidad de reportes impresos, ya que los resultados se generan y visualizan de forma digital. |
| Consumo energético | Es bajo, debido a que el sistema funciona en equipos de uso común sin requerir servidores de alto consumo. |
| Recursos digitales | Se promueve el almacenamiento digital de datos y reportes, reduciendo el uso de materiales físicos. |
| Sostenibilidad     | Fomenta prácticas ecológicas en el entorno académico mediante el uso de tecnologías digitales y procesos paperless. |




5. **Análisis Financiero**

La finalidad del análisis financiero del proyecto SimCargaDB es evaluar los costos involucrados en su desarrollo frente a los beneficios obtenidos en el contexto académico, determinando su viabilidad económica y el valor que aporta como herramienta de aprendizaje y apoyo tecnológico.
Dado que el proyecto se desarrolla en un entorno académico, no se plantea como un producto comercial directo; sin embargo, se puede estimar su valor como solución tecnológica. Los costos están principalmente asociados al recurso humano y gastos operativos, mientras que los beneficios se reflejan en el aprendizaje adquirido, la optimización de pruebas de bases de datos y su posible uso futuro en entornos profesionales.


| Indicador                 | Detalle |
|---------------------------|--------|
| Costo total del proyecto  | El costo total estimado es de S/. 3,710, considerando costos generales, operativos y de personal. |
| Valor del proyecto        | Se estima un valor referencial de S/. 5,000 como solución tecnológica académica con potencial de uso profesional. |
| Beneficios esperados      | Mejora en el aprendizaje práctico, optimización de pruebas de bases de datos y desarrollo de competencias técnicas en los usuarios. |
| Relación Beneficio/Costo  | La relación estimada es mayor a 1, lo que indica que el proyecto es viable desde el punto de vista económico. |




    5.1. Justificación de la Inversión

El análisis financiero del proyecto SimCargaDB tiene como finalidad estimar los costos y beneficios asociados a su desarrollo, considerando su impacto en el aprendizaje, la optimización de procesos y su potencial aplicación en entornos reales.
La inversión requerida para el desarrollo del sistema es relativamente baja, ya que se basa en el uso de herramientas de software libre y recursos tecnológicos disponibles en el entorno académico. Los principales costos están relacionados con el esfuerzo del recurso humano y los gastos operativos básicos durante el periodo de desarrollo.


        5.1.1. Beneficios del Proyecto

El sistema SimCargaDB representa un aporte significativo en el ámbito académico y tecnológico, ya que permite mejorar la comprensión y análisis del rendimiento de bases de datos mediante la simulación de cargas de trabajo. Esto se logra a través de la ejecución de pruebas controladas que facilitan la identificación de posibles fallas y oportunidades de optimización en sistemas de bases de datos.
Asimismo, el sistema contribuye a la mejora de la eficiencia en el proceso de aprendizaje, ya que permite a los estudiantes experimentar con escenarios reales de concurrencia sin necesidad de implementar entornos complejos o costosos. Esto se traduce en un ahorro de tiempo y recursos, además de fortalecer las competencias prácticas en desarrollo y análisis de sistemas.
Otro beneficio importante es la disponibilidad de métricas claras y resultados medibles, lo que permite realizar evaluaciones objetivas del rendimiento de las bases de datos. Esto favorece la toma de decisiones informadas y promueve buenas prácticas en el desarrollo de software, tales como la optimización de consultas y el manejo eficiente de recursos.
En el ámbito académico, el proyecto genera un impacto positivo al servir como herramienta de apoyo para cursos relacionados con bases de datos, programación y sistemas, facilitando la enseñanza y el aprendizaje práctico. Además, fomenta el interés en el análisis de rendimiento y en el desarrollo de soluciones tecnológicas innovadoras.
Finalmente, el proyecto aporta en términos de sostenibilidad, ya que promueve el uso de herramientas digitales para la generación de reportes y análisis, reduciendo la necesidad de documentación física y contribuyendo al uso eficiente de los recursos tecnológicos disponibles.



        
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

La relación Beneficio/Costo (B/C) permite evaluar la viabilidad económica del proyecto comparando los beneficios obtenidos frente a los costos de inversión. Un valor mayor a 1 indica que los beneficios superan los costos, lo que justifica la ejecución del proyecto.
Para el caso del sistema SimCargaDB, se consideran como costos principales el desarrollo del sistema (recursos humanos y operativos), mientras que los beneficios están asociados al valor académico, la optimización de procesos de prueba y su potencial aplicación futura en entornos profesionales.


| Concepto             | Valor |
|----------------------|-------|
| Inversión total      | 3,710 |
| Beneficios esperados | 5,000 |
| Relación B/C         | 1.35  |

Como **B/C > 1**, el proyecto es viable.

            5.1.2.2. Valor Actual Neto (VAN)
            
El Valor Actual Neto (VAN) permite determinar la rentabilidad del proyecto mediante la diferencia entre el valor presente de los beneficios esperados y la inversión inicial, considerando una tasa de descuento. Para este proyecto, se asume una tasa del 10% anual, acorde a un escenario académico referencial.


| Concepto               | Valor (S/.) |
|------------------------|------------|
| Beneficios descontados | 4,545      |
| Inversión inicial      | 3,710      |
| VAN                    | 835        |


Como **VAN > 0**, el proyecto se acepta.


            5.1.2.3 Tasa Interna de Retorno (TIR)*

La Tasa Interna de Retorno (TIR) representa la tasa de descuento que iguala el valor actual de los beneficios con la inversión inicial del proyecto.


### Resumen del análisis financiero

| Concepto | Valor |
|----------|-------|
| TIR      | 18%   |
| COK      | 10%   |



<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

6. <span id="_Toc52661357" class="anchor"></span>**Conclusiones**

El análisis realizado confirma que el proyecto SimCargaDB es técnica, económica, operativa, legal, social y ambientalmente viable. La selección de tecnologías como Java/Python, MySQL y PostgreSQL, junto con herramientas de desarrollo accesibles, garantiza un sistema funcional, escalable y adecuado para su implementación en un entorno académico.

En el aspecto económico, la mayor inversión corresponde al recurso humano; sin embargo, los indicadores financieros obtenidos (B/C > 1, VAN positivo y TIR superior al COK) demuestran que el proyecto es rentable y que la inversión realizada se encuentra justificada, generando valor tanto en el ámbito académico como en su posible aplicación futura.

Desde el punto de vista operativo, el sistema es fácil de implementar y utilizar, permitiendo simular cargas de trabajo en bases de datos de manera eficiente. Esto contribuye a mejorar los procesos de análisis de rendimiento, optimización de consultas y toma de decisiones en el desarrollo de sistemas.

Legalmente, el proyecto cumple con las normativas vigentes, ya que no utiliza datos personales reales y se apoya en tecnologías de software libre, evitando conflictos relacionados con licencias y protección de información.

En el ámbito social, el sistema aporta al fortalecimiento del aprendizaje práctico y al desarrollo de competencias técnicas en los estudiantes, promoviendo una mejor preparación profesional. Asimismo, contribuye a la generación de conocimiento en el área de bases de datos y análisis de sistemas.

Finalmente, el proyecto favorece la sostenibilidad ambiental al promover el uso de herramientas digitales, reduciendo la necesidad de documentación física y optimizando el uso de recursos tecnológicos.
En síntesis, el proyecto SimCargaDB no solo es factible y rentable, sino que también representa una solución útil, formativa y con impacto positivo en el entorno académico y tecnológico.
