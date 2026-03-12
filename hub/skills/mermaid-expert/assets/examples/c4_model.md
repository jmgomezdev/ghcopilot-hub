# Mermaid C4 Model Expert Guide

Use C4 diagrams to visualize software architecture at different levels of abstraction.

## 1. System Context (Level 1)
The big picture. How the system fits into the existing IT landscape.

```mermaid
C4Context
  title System Context diagram for Internet Banking System
  
  Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")
  System(SystemAA, "Internet Banking System", "Allows customers to view information about their bank accounts, and make payments.")

  System_Ext(SystemE, "Mainframe Banking System", "Stores all of the core banking information about customers, accounts, transactions, etc.")

  Rel(customerA, SystemAA, "Uses")
  Rel(SystemAA, SystemE, "Uses")
```

## 2. Container Diagram (Level 2)
Zoom in to the system boundaries. Shows applications, data stores, and microservices.

```mermaid
C4Container
  title Container diagram for Internet Banking System

  Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")

  Container_Boundary(c1, "Internet Banking") {
      Container(web_app, "Web Application", "Java, Spring MVC", "Delivers the static content and the Internet banking SPA")
      Container(spa, "Single-Page App", "JavaScript, Angular", "Provides all the Internet banking functionality to customers via their web browser")
      Container(mobile_app, "Mobile App", "C#, Xamarin", "Provides a limited subset of the Internet banking functionality to customers via their mobile device")
      ContainerDb(database, "Database", "Relational Database Schema", "Stores user registration information, hashed auth credentials, access logs, etc.")
  }

  System_Ext(email_system, "E-mail System", "The internal Microsoft Exchange e-mail system.")
  
  Rel(customerA, web_app, "Uses", "HTTPS")
  Rel(customerA, spa, "Uses", "HTTPS")
  Rel(customerA, mobile_app, "Uses")
  
  Rel(web_app, spa, "Delivers")
  Rel(spa, database, "Reads from/Writes to", "JDBC")
```

## 3. Component Diagram (Level 3)
Inside a container. Shows internal components/modules.

```mermaid
C4Component
  title Component diagram for Internet Banking System - API Application

  Container(spa, "Single Page Application", "javascript and angular", "Provides all the Internet banking functionality to customers via their web browser.")
  ContainerDb(db, "Database", "Relational Database Schema", "Stores user registration information, hashed auth credentials, access logs, etc.")
  
  Container_Boundary(api, "API Application") {
      Component(sign, "Sign In Controller", "MVC Rest Controlle", "Allows users to sign in to the internet banking system")
      Component(accounts, "Accounts Summary Controller", "MVC Rest Controller", "Provides customers with a summary of their bank accounts")
      Component(security, "Security Component", "Spring Bean", "Provides functionality related to signing in, changing passwords, etc.")
      Component(mbsfacade, "Mainframe Banking System Facade", "Spring Bean", "A facade onto the mainframe banking system.")
  }

  Rel(spa, sign, "Uses", "JSON/HTTPS")
  Rel(sign, security, "Uses")
  Rel(security, db, "Read & write to", "JDBC")
```

## 4. Deployment Diagram
Mapping containers to infrastructure.

```mermaid
C4Deployment
  title Deployment Diagram for Internet Banking System - Live

  Deployment_Node(mob, "Customer's mobile device", "Apple IOS or Android"){
    Container(mobile, "Mobile App", "Xamarin", "Provides a limited subset of the Internet banking functionality to customers via their mobile device.")
  }

  Deployment_Node(comp, "Customer's computer", "Deep Blue"){
    Deployment_Node(browser, "Web Browser", "Google Chrome, Mozilla Firefox"){
      Container(spa, "Single Page Application", "JavaScript and Angular", "Provides all the Internet banking functionality to customers via their web browser.")
    }
  }

  Deployment_Node(plc, "Big Bank plc", "Big Bank plc data center"){
    Deployment_Node(dn, "bigbank-api***\tx8", "Ubuntu 16.04 LTS"){
      Deployment_Node(apache, "Apache Tomcat", "Apache Tomcat 8.x"){
        Container(api, "API Application", "Java and Spring MVC", "Provides Internet banking functionality via a JSON/HTTPS API.")
      }
    }
  }

  Rel(mobile, api, "Makes API calls to", "json/HTTPS")
  Rel(spa, api, "Makes API calls to", "json/HTTPS")
```

## 5. Dynamic Diagram
Runtime view of interactions.

```mermaid
C4Dynamic
  title Dynamic diagram for Internet Banking System - API Application

  ContainerDb(c4, "Database", "Relational Database Schema", "Stores user registration information, hashed auth credentials, access logs, etc.")
  Container(c1, "Single-Page Application", "JavaScript and Angular", "Provides all the Internet banking functionality to customers via their web browser.")
  
  Container_Boundary(b, "API Application") {
    Component(c3, "Security Component", "Spring Bean", "Provides functionality related to signing in, changing passwords, etc.")
    Component(c2, "Sign In Controller", "Spring MVC Rest Controller", "Allows users to sign in to the internet banking system.")
  }
  
  Rel(c1, c2, "Submits credentials to", "JSON/HTTPS")
  Rel(c2, c3, "Calls isAuthenticated() on")
  Rel(c3, c4, "select * from users where username = ?", "JDBC")
```
