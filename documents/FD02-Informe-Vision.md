![Logo](../media/logo-upt.png)

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

**  
**
</center>
<div style="page-break-after: always; visibility: hidden">\pagebreak</div>







**Sistema *Simulación de carga de bds***

**Documento de Visión**

**Versión *{1.0}***
**

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

 CONTROL DE VERSIONES |           |              |               |            |                 |
|:--------------------:|:----------|:-------------|:--------------|:-----------|:----------------|
|       Versión        | Hecha por | Revisada por | Aprobada por  | Fecha      | Motivo          |
|         1.0          | APO, JVL  | APO, JVL     | P. Cuadros Q. | 2026-04-15 | Versión inicial |


<div style="page-break-after: always; visibility: hidden">\pagebreak</div>


**INDICE GENERAL**
#
[1.	Introducción](#_Toc52661346)

1.1	Propósito
    
1.2	Alcance

1.3	Definiciones, Siglas y Abreviaturas
    
1.4	Referencias

1.5	Visión General




[2.	Posicionamiento](#_Toc52661347)

2.1	Oportunidad de negocio

2.2	Definición del problema



[3.	Descripción de los interesados y usuarios](#_Toc52661348)

3.1	Resumen de los interesados
    
3.2	Resumen de los usuarios

3.3	Entorno de usuario

3.4	Perfiles de los interesados 

3.5	Perfiles de los Usuarios
    
3.6	Necesidades de los interesados y usuarios
    


[4.	Vista General del Producto](#_Toc52661349)

4.1	Perspectiva del producto

4.2	Resumen de capacidades

4.3	Suposiciones y dependencias

4.4	Costos y precios

4.5	Licenciamiento e instalación




[5.	Características del producto](#_Toc52661350)

[6.	Restricciones](#_Toc52661351)

[7.	Rangos de calidad](#_Toc52661352)

[8.	Precedencia y Prioridad](#_Toc52661353)

[9.	Otros requerimientos del producto](#_Toc52661354)

b) Estandares legales

c) Estandares de comunicación	](#_toc394513800)37

d) Estandaraes de cumplimiento de la plataforma	](#_toc394513800)42

e) Estandaraes de calidad y seguridad	](#_toc394513800)42

[CONCLUSIONES](#_Toc52661355)

[RECOMENDACIONES](#_Toc52661356)

[BIBLIOGRAFIA](#_Toc52661357)

[WEBGRAFIA](#_Toc52661358)


<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

**<u>Informe de Visión</u>**

1. <span id="_Toc52661346" class="anchor"></span>**Introducción**

        1.1	Propósito

El presente documento de visión tiene como propósito describir de manera general el sistema SimCargaDB, el cual consiste en una herramienta para la simulación de carga en bases de datos. Este documento define el alcance del sistema, los usuarios involucrados, las necesidades principales y las características generales del producto, sirviendo como base para el desarrollo del proyecto.
    

        1.2	Alcance

El sistema SimCargaDB permitirá simular cargas de trabajo en bases de datos mediante la ejecución de operaciones concurrentes como SELECT, INSERT, UPDATE y DELETE.
Está dirigido principalmente a estudiantes y desarrolladores en entornos académicos, con el objetivo de analizar el rendimiento de bases de datos y detectar posibles fallas antes de su implementación en producción.
El sistema no está orientado a uso comercial, sino educativo, y será desarrollado utilizando tecnologías accesibles como Python o Java.          

    
        1.3	Definiciones, Siglas y Abreviaturas

Para una mejor comprensión del presente documento, se definen los siguientes términos:
- Base de Datos (BD): Conjunto organizado de datos que pueden ser almacenados, gestionados y consultados mediante sistemas informáticos.
- IDE (Entorno de Desarrollo Integrado): Software que proporciona herramientas necesarias para el desarrollo de aplicaciones, como editor de código, compilador y depurador.
- SQL (Structured Query Language): Lenguaje utilizado para gestionar y manipular bases de datos relacionales mediante consultas.
- Concurrencia: Capacidad de un sistema para ejecutar múltiples procesos o tareas de manera simultánea.


        1.4	Referencias

- Informe de Factibilidad del proyecto SimCargaDB
- Documentación oficial de MySQL y PostgreSQL
- Guías académicas del curso Base de Datos II
- Documentación de Python / Java


        1.5	Visión General

El documento está estructurado en secciones que describen el posicionamiento del sistema, los interesados y usuarios, así como una vista general del producto. Se detallan las capacidades del sistema, sus limitaciones y los aspectos clave para su desarrollo dentro del entorno académico.





<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

2. <span id="_Toc52661347" class="anchor"></span>**Posicionamiento**

        2.1	Oportunidad de negocio

Actualmente, muchas aplicaciones no cuentan con herramientas adecuadas para evaluar el rendimiento de sus bases de datos antes de ser implementadas, lo que puede generar fallas, lentitud o caídas del sistema.
SimCargaDB surge como una solución académica que permite simular escenarios reales de carga, facilitando el análisis del rendimiento sin necesidad de herramientas costosas.



        2.2	Definición del problema

Las pruebas de rendimiento en bases de datos suelen ser limitadas o no representan escenarios reales de alta concurrencia.

Esto impide detectar problemas como:
- Lentitud en consultas
- Fallas en concurrencia
- Sobrecarga del sistema

Por ello, es necesario contar con una herramienta que permita simular múltiples solicitudes y analizar el comportamiento del sistema antes de su uso real.


<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

3. <span id="_Toc52661348" class="anchor"></span>**Vista General del Producto**

    3.1	Resumen de los interesados

En esta subsección se presentan los principales actores involucrados en el desarrollo y uso del sistema, así como su rol dentro del proyecto.

    3.2	Resumen de los usuarios

Aquí se identifican los usuarios finales del sistema, quienes interactuarán directamente con la herramienta para cumplir sus objetivos.

| Usuario         | Descripción                                              |
|----------------|----------------------------------------------------------|
| Estudiantes    | Utilizan el sistema para prácticas y aprendizaje         |
| Desarrolladores| Analizan el rendimiento de bases de datos               |


    3.3	Entorno de usuario

Esta subsección describe las condiciones técnicas y el ambiente en el que el sistema será utilizado, incluyendo hardware, software y conectividad.

| Elemento            | Descripción                                              |
|--------------------|----------------------------------------------------------|
| Tipo de entorno    | Académico (universidad)                                  |
| Dispositivo        | PC o laptop                                              |
| Sistema operativo  | Windows o Linux                                          |
| Procesador         | Intel Core i5 o equivalente                              |
| Memoria RAM        | 8 GB mínimo                                              |
| Software requerido | Navegador web, IDE (VS Code / NetBeans)                  |
| Conectividad       | Acceso a internet                                        |


    3.4	Perfiles de los interesados
    
En esta sección se describen las características y expectativas de los interesados, considerando su relación con el sistema y su participación en el proyecto.

| Interesado     | Perfil                                                   |
|---------------|----------------------------------------------------------|
| Docente       | Evalúa el cumplimiento de objetivos académicos           |
| Universidad   | Promueve el aprendizaje práctico                         |
| Desarrollador | Diseña, implementa y prueba el sistema                   |



    3.5	Perfiles de los Usuarios

Se presentan los perfiles de los usuarios finales, considerando sus conocimientos, habilidades y forma de interacción con el sistema.

| Usuario          | Perfil                                                   |
|------------------|----------------------------------------------------------|
| Estudiante       | Con conocimientos básicos en bases de datos              |
| Usuario técnico  | Capaz de interpretar métricas y resultados              |


    

    3.6	Necesidades de los interesados y usuarios

Esta subsección identifica los requerimientos principales que el sistema debe satisfacer para cumplir con las expectativas de los interesados y usuarios.

| Necesidad                          | Descripción                                             |
|----------------------------------|---------------------------------------------------------|
| Simulación de carga              | Ejecutar múltiples operaciones simultáneas              |
| Análisis de rendimiento          | Medir tiempos y comportamiento del sistema              |
| Detección de fallas              | Identificar errores en condiciones de alta carga        |
| Aprendizaje práctico             | Facilitar la comprensión de bases de datos              |
| Accesibilidad                    | Uso sencillo con herramientas disponibles               |





<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

4. <span id="_Toc52661349" class="anchor"></span>**Estudio de
    Factibilidad**


        4.1	Perspectiva del producto

SimCargaDB es un sistema independiente que interactúa con bases de datos relacional y no relacional.No depende de sistemas externos complejos y puede ejecutarse en entornos locales.


    4.2	Resumen de capacidades

El sistema permitirá:
- Simulación de múltiples usuarios concurrentes
- Ejecución de operaciones SQL
- Registro de tiempos de respuesta
- Generación de métricas
- Visualización de resultados


        4.3	Suposiciones y dependencias

- Disponibilidad de una base de datos para pruebas
- Acceso a herramientas de desarrollo (IDE)
- Conexión a internet
- Conocimientos básicos del usuario


        4.4	Costos y precios

En esta sección se presentan los costos estimados para el desarrollo del sistema SimCargaDB, considerando recursos materiales, servicios básicos y esfuerzo del personal involucrado. Dado que se trata de un proyecto académico, no se establece un precio de comercialización, sino un análisis referencial del costo total de implementación.


  | Tipo de costo        | Descripción                                      | Costo (S/.) |
|---------------------|--------------------------------------------------|------------|
| Recursos tecnológicos | Uso de laptop/computadora (recurso propio)      | 0.00       |
| Materiales           | Cuadernos, lapiceros, impresiones               | 135.00     |
| Servicios básicos    | Internet y energía eléctrica                    | 130.00     |
| Desarrollo           | Mano de obra (2 desarrolladores)                | 1600.00    |
| **Total estimado**   | Costo total del desarrollo del sistema          | **2025.00** |
| Precio del sistema   | No aplica (proyecto académico)                  | 0.00       |


    4.5	Licenciamiento e instalación

Esta sección describe las condiciones de uso del sistema, así como los requerimientos necesarios para su instalación. El sistema se basa en tecnologías open-source, lo que permite su uso libre en entornos académicos, facilitando su implementación en equipos personales sin costos de licencia.

  | Aspecto               | Descripción                                                                 |
|----------------------|-----------------------------------------------------------------------------|
| Tipo de licencia     | Software open-source (código abierto)                                       |
| Lenguaje             | Python o Java                                                               |
| Base de datos        | MySQL / PostgreSQL                                                          |
| IDE                  | Visual Studio Code / NetBeans                                               |
| Sistema operativo    | Compatible con Windows y Linux                                              |
| Instalación          | Instalación local en equipos personales                                     |
| Requisitos mínimos   | PC o laptop, 8GB RAM, conexión a internet                                   |
| Costo de licencia    | Gratuito                                                                    |
| Distribución         | Uso académico y educativo                                                   |





<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

5. <span id="_Toc52661350" class="anchor"></span>**Características del producto**

El sistema *SimCargaDB* contará con diversas funcionalidades orientadas a la simulación de carga en bases de datos, permitiendo analizar su rendimiento bajo diferentes condiciones. Entre las principales características se destacan:

- **Simulación de usuarios concurrentes:** Permite generar múltiples solicitudes simultáneas hacia la base de datos.  
- **Ejecución de operaciones SQL:** Soporta consultas como SELECT, INSERT, UPDATE y DELETE.  
- **Registro de métricas:** Captura tiempos de respuesta, número de operaciones y comportamiento del sistema.  
- **Visualización de resultados:** Presenta los datos obtenidos mediante reportes claros y comprensibles.  
- **Configuración de pruebas:** Permite ajustar parámetros como número de usuarios, tipo de operación y duración de la prueba.  
- **Compatibilidad con múltiples bases de datos:** Funciona con MySQL y PostgreSQL.  

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>



6. <span id="_Toc52661351" class="anchor"></span>**Restricciones**

El desarrollo e implementación del sistema *SimCargaDB* presenta ciertas limitaciones que deben ser consideradas:

- **Tiempo limitado de desarrollo:** El proyecto debe completarse en un periodo de 4 semanas.  
- **Recursos tecnológicos básicos:** Se trabaja con equipos personales sin infraestructura avanzada.  
- **Alcance académico:** El sistema no está diseñado para entornos empresariales o de producción real.  
- **Dependencia de conocimientos técnicos:** Requiere conocimientos básicos en programación y bases de datos.  
- **Limitaciones de hardware:** El rendimiento puede variar según la capacidad del equipo utilizado.  

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>


7. <span id="_Toc52661352" class="anchor"></span>**Rangos de Calidad**

El sistema deberá cumplir con ciertos estándares de calidad para garantizar su correcto funcionamiento:
- **Rendimiento:** Capacidad de ejecutar múltiples operaciones sin fallos críticos.  
- **Usabilidad:** Interfaz sencilla y fácil de utilizar para usuarios académicos.  
- **Fiabilidad:** Resultados consistentes en las pruebas realizadas.  
- **Eficiencia:** Uso adecuado de recursos del sistema (CPU, memoria).  
- **Mantenibilidad:** Código organizado y documentado para futuras mejoras.  

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>


8. <span id="_Toc52661353" class="anchor"></span>**Precedencia y Prioridad**

Las funcionalidades del sistema se desarrollarán siguiendo un orden de prioridad, considerando la importancia de cada componente:

| Prioridad | Funcionalidad                | Descripción |
|----------|-----------------------------|------------|
| Alta     | Conexión a base de datos    | Permite establecer comunicación con MySQL/PostgreSQL |
| Alta     | Simulación de carga         | Generación de múltiples solicitudes concurrentes |
| Alta     | Ejecución de operaciones SQL| Procesamiento de consultas básicas |
| Media    | Registro de métricas        | Almacenamiento de resultados de las pruebas |
| Media    | Visualización de resultados | Presentación de datos en reportes |
| Baja     | Configuración avanzada      | Personalización de parámetros de prueba |

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>


9. <span id="_Toc52661354" class="anchor"></span>**Otros requerimientos del producto**
    
En esta sección se detallan aspectos adicionales que el sistema debe cumplir para su correcto desarrollo y funcionamiento:

     9.1 Estándares legales

El sistema deberá cumplir con la normativa vigente, como la Ley N.º 29733 de Protección de Datos Personales en el Perú, garantizando que no se utilicen datos reales, sino simulados. Asimismo, se respetarán los derechos de propiedad intelectual en el desarrollo del software.

     9.2 Estándares de comunicación

Se empleará una comunicación clara y estructurada entre los integrantes del proyecto mediante herramientas digitales como GitHub, facilitando la gestión de tareas, control de versiones y documentación del sistema.

     9.3 Estándares de cumplimiento de la plataforma

El sistema deberá ser compatible con los sistemas operativos Windows y Linux, así como con bases de datos MySQL y PostgreSQL, garantizando su correcto funcionamiento en entornos académicos.

     9.4 Estándares de calidad y seguridad

Se implementarán buenas prácticas de desarrollo, como validación de datos, control de errores y uso eficiente de recursos. Además, se asegurará que el sistema no represente riesgos para la integridad de los datos ni del entorno donde se ejecute.

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>



<span id="_Toc52661355" class="anchor"></span>**CONCLUSIONES**

El desarrollo del sistema *SimCargaDB* demuestra que es posible implementar una herramienta de simulación de carga en bases de datos utilizando tecnologías accesibles y recursos disponibles en un entorno académico. A través del análisis realizado en el estudio de factibilidad, se determinó que el proyecto es viable desde el punto de vista técnico, económico y operativo.

El sistema propuesto permite ejecutar operaciones concurrentes y medir el rendimiento de bases de datos, contribuyendo a la identificación de posibles fallas y a la optimización de sistemas antes de su implementación en entornos reales. Esto representa un aporte significativo en el aprendizaje práctico de los estudiantes, fortaleciendo sus competencias en áreas como programación, bases de datos y análisis de sistemas.

Asimismo, el uso de herramientas open-source y la ausencia de requerimientos de infraestructura compleja hacen que el sistema sea accesible, escalable y fácil de implementar. En conjunto, el proyecto cumple con los objetivos planteados, consolidándose como una solución útil dentro del ámbito académico.

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>



<span id="_Toc52661356" class="anchor"></span>**RECOMENDACIONES**

Se recomienda continuar con el desarrollo del sistema incorporando mejoras en la interfaz de usuario, con el fin de facilitar aún más la interacción y comprensión de los resultados obtenidos.

Asimismo, se sugiere ampliar las funcionalidades del sistema, incluyendo nuevos tipos de pruebas de carga y soporte para otros sistemas gestores de bases de datos, lo que permitiría incrementar su alcance y aplicabilidad.

Es recomendable realizar pruebas más exhaustivas en diferentes entornos y configuraciones de hardware, con el objetivo de validar el comportamiento del sistema en condiciones más cercanas a escenarios reales.

Finalmente, se aconseja mantener una adecuada documentación del sistema y aplicar buenas prácticas de desarrollo, lo que facilitará su mantenimiento, mejora continua y posible implementación en proyectos futuros.

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>



<span id="_Toc52661357" class="anchor"></span>**BIBLIOGRAFIA**

- Silberschatz, A., Korth, H. F., & Sudarshan, S. (2019). *Fundamentos de bases de datos* (6ta ed.). McGraw-Hill.

- Elmasri, R., & Navathe, S. B. (2017). *Sistemas de bases de datos* (7ma ed.). Pearson Educación.

- Sommerville, I. (2016). *Ingeniería de software* (10ma ed.). Pearson.

- Pressman, R. S., & Maxim, B. R. (2015). *Ingeniería del software: Un enfoque práctico* (8va ed.). McGraw-Hill.

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>



<span id="_Toc52661358" class="anchor"></span>**WEBGRAFIA**

- MySQL. (s.f.). Documentación oficial. Recuperado de: https://dev.mysql.com/doc/

- PostgreSQL. (s.f.). Documentación oficial. Recuperado de: https://www.postgresql.org/docs/

- Python Software Foundation. (s.f.). Documentación oficial de Python. Recuperado de: https://docs.python.org/3/

- Oracle. (s.f.). Documentación oficial de Java. Recuperado de: https://docs.oracle.com/en/java/

- GitHub. (s.f.). Guía de uso y control de versiones. Recuperado de: https://docs.github.com/

- OWASP Foundation. (s.f.). Buenas prácticas de seguridad en aplicaciones. Recuperado de: https://owasp.org/


<div style="page-break-after: always; visibility: hidden">\pagebreak</div>
