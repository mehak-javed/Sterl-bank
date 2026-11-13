# Sterl API container. Two stages: build with the full JDK and Maven, run on a small JRE image.
# Build from this folder:  docker build -t sterl-api .

# ---------- 1. Build ----------
FROM eclipse-temurin:25-jdk AS build
WORKDIR /src
# Dependencies first: this layer is cached until pom.xml changes, so rebuilds are fast.
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw -B -ntp dependency:go-offline
COPY src src
# Tests need PostgreSQL, so they run in CI (api.yml) before anything is merged, not here.
RUN ./mvnw -B -ntp -DskipTests package && cp target/sterl-api-*.jar /src/app.jar

# ---------- 2. Run ----------
FROM eclipse-temurin:25-jre
WORKDIR /app
# Never run as root: a compromised app can't change the container itself.
RUN useradd --system --no-create-home sterl
COPY --from=build /src/app.jar app.jar
USER sterl
# Size the JVM heap from the container's memory (free hosting plans have about 512 MB).
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -XX:TieredStopAtLevel=1"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
