# Build stage
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy parent and module configs
COPY pom.xml .
COPY shared-core/pom.xml shared-core/
COPY backend-api/pom.xml backend-api/
COPY worker-service/pom.xml worker-service/

# Download dependencies (caching layer)
RUN mvn dependency:go-offline -B

# Copy source code
COPY shared-core/src shared-core/src
COPY worker-service/src worker-service/src

# Package worker service
RUN mvn clean package -pl worker-service -am -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/worker-service/target/worker-service-1.0.0.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]
