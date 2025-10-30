const { getSession } = require('../config/neo4j');

/**
 * Neo4j Service for Ministry Analytics
 * Manages graph relationships between Personas, Universidades, and Carreras
 */
class Neo4jService {

  /**
   * Sync student interest from Redis/Cassandra to Neo4j
   * Creates Persona, Universidad, Carrera nodes and their relationships
   */
  async syncStudentInterest(prospectoData) {
    const session = getSession();

    try {
      const {
        dni,
        nombreCompleto,
        email,
        institucionId,
        carreraId,
        institucion,
        carrera,
        estado,
        timestamp
      } = prospectoData;

      // Cypher query to create/update nodes and relationships
      const query = `
        // 1. Merge Persona node (upsert based on DNI)
        MERGE (p:Persona {dni: $dni})
        ON CREATE SET
          p.nombreCompleto = $nombreCompleto,
          p.email = $email,
          p.created_at = datetime($timestamp)
        ON MATCH SET
          p.nombreCompleto = $nombreCompleto,
          p.email = $email,
          p.updated_at = datetime($timestamp)

        // 2. Merge Universidad node
        MERGE (u:Universidad {institution_id: $institution_id})
        ON CREATE SET
          u.nombre = $universidad_nombre,
          u.nombre_corto = $universidad_nombre_corto,
          u.tipo = $universidad_tipo,
          u.ciudad = $universidad_ciudad,
          u.provincia = $universidad_provincia,
          u.created_at = datetime($timestamp)

        // 3. Merge Carrera node
        MERGE (c:Carrera {career_id: $career_id})
        ON CREATE SET
          c.nombre = $carrera_nombre,
          c.codigo = $carrera_codigo,
          c.facultad = $carrera_facultad,
          c.categoria = $carrera_categoria,
          c.created_at = datetime($timestamp)

        // 4. Create relationship Carrera -> Universidad
        MERGE (c)-[r1:SE_DICTA_EN]->(u)
        ON CREATE SET r1.created_at = datetime($timestamp)

        // 5. Create relationship Persona -> Universidad (with estado)
        MERGE (p)-[r2:INTERESADO_EN_UNIVERSIDAD]->(u)
        ON CREATE SET
          r2.estado = $estado,
          r2.timestamp = datetime($timestamp),
          r2.etapa_actual = 'interesado'
        ON MATCH SET
          r2.estado = $estado,
          r2.updated_at = datetime($timestamp)

        // 6. Create relationship Persona -> Carrera
        MERGE (p)-[r3:INTERESADO_EN_CARRERA]->(c)
        ON CREATE SET
          r3.timestamp = datetime($timestamp),
          r3.prioridad = 1
        ON MATCH SET
          r3.updated_at = datetime($timestamp)

        RETURN p, u, c
      `;

      const params = {
        dni: dni.toString(),
        nombreCompleto,
        email,
        institution_id: institucionId,
        universidad_nombre: institucion.nombre,
        universidad_nombre_corto: institucion.nombre_corto,
        universidad_tipo: institucion.tipo,
        universidad_ciudad: institucion.ciudad || '',
        universidad_provincia: institucion.provincia || '',
        career_id: carreraId,
        carrera_nombre: carrera.nombre,
        carrera_codigo: carrera.codigo,
        carrera_facultad: carrera.facultad,
        carrera_categoria: carrera.categoria || '',
        estado: estado || 'interesado',
        timestamp: timestamp || new Date().toISOString()
      };

      await session.run(query, params);

      console.log(` [Neo4j] Synced interest for DNI ${dni} -> ${institucion.nombre_corto} (${carrera.nombre})`);

      return { success: true, dni };

    } catch (error) {
      console.error('L [Neo4j] Error syncing student interest:', error.message);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Update relationship status when student progresses through stages
   */
  async updateStudentStatus(dni, institucionId, newStatus, etapaActual) {
    const session = getSession();

    try {
      const query = `
        MATCH (p:Persona {dni: $dni})-[r:INTERESADO_EN_UNIVERSIDAD]->(u:Universidad {institution_id: $institution_id})
        SET r.estado = $estado,
            r.etapa_actual = $etapa_actual,
            r.updated_at = datetime()
        RETURN p, r, u
      `;

      const params = {
        dni: dni.toString(),
        institution_id: institucionId,
        estado: newStatus,
        etapa_actual: etapaActual
      };

      const result = await session.run(query, params);

      if (result.records.length > 0) {
        console.log(` [Neo4j] Updated status for DNI ${dni}: ${newStatus} (${etapaActual})`);
        return { success: true, updated: true };
      } else {
        console.log(`�  [Neo4j] No relationship found for DNI ${dni} and institution ${institucionId}`);
        return { success: true, updated: false };
      }

    } catch (error) {
      console.error('L [Neo4j] Error updating student status:', error.message);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Enrich Persona node with additional demographic data
   * (To be called when ministry adds demographic info based on DNI)
   */
  async enrichPersonaData(dni, additionalData) {
    const session = getSession();

    try {
      const query = `
        MATCH (p:Persona {dni: $dni})
        SET p += $additionalData,
            p.enriched_at = datetime()
        RETURN p
      `;

      const params = {
        dni: dni.toString(),
        additionalData: {
          edad: additionalData.edad || null,
          region: additionalData.region || null,
          nivel_educativo: additionalData.nivel_educativo || null,
          genero: additionalData.genero || null,
          ...additionalData
        }
      };

      await session.run(query, params);

      console.log(` [Neo4j] Enriched Persona data for DNI ${dni}`);

      return { success: true };

    } catch (error) {
      console.error('L [Neo4j] Error enriching persona data:', error.message);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * ANALYTICS: Get most popular careers by age range
   */
  async getPopularCareersByAge(minAge, maxAge) {
    const session = getSession();

    try {
      const query = `
        MATCH (p:Persona)-[:INTERESADO_EN_CARRERA]->(c:Carrera)
        WHERE p.edad >= $minAge AND p.edad <= $maxAge
        RETURN c.nombre as carrera,
               c.categoria as categoria,
               count(p) as cantidad_interesados,
               collect(DISTINCT p.edad) as edades
        ORDER BY cantidad_interesados DESC
        LIMIT 20
      `;

      const result = await session.run(query, { minAge, maxAge });

      return result.records.map(record => ({
        carrera: record.get('carrera'),
        categoria: record.get('categoria'),
        cantidad_interesados: record.get('cantidad_interesados').toNumber(),
        edades: record.get('edades')
      }));

    } catch (error) {
      console.error('L [Neo4j] Error getting popular careers by age:', error.message);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * ANALYTICS: Get acceptance/rejection rates by university
   */
  async getUniversityConversionRates() {
    const session = getSession();

    try {
      const query = `
        MATCH (u:Universidad)<-[r:INTERESADO_EN_UNIVERSIDAD]-(p:Persona)
        WITH u,
             count(r) as total_interesados,
             count(CASE WHEN r.estado = 'aceptado' THEN 1 END) as aceptados,
             count(CASE WHEN r.estado = 'rechazado' THEN 1 END) as rechazados,
             count(CASE WHEN r.estado IN ['interesado', 'documentacion_pendiente', 'en_revision', 'curso_ingreso'] THEN 1 END) as en_proceso
        RETURN u.nombre as universidad,
               u.nombre_corto as sigla,
               u.tipo as tipo,
               u.provincia as provincia,
               total_interesados,
               aceptados,
               rechazados,
               en_proceso,
               CASE WHEN total_interesados > 0
                    THEN toFloat(aceptados) * 100 / total_interesados
                    ELSE 0
               END as tasa_aceptacion
        ORDER BY total_interesados DESC
      `;

      const result = await session.run(query);

      return result.records.map(record => ({
        universidad: record.get('universidad'),
        sigla: record.get('sigla'),
        tipo: record.get('tipo'),
        provincia: record.get('provincia'),
        total_interesados: record.get('total_interesados').toNumber(),
        aceptados: record.get('aceptados').toNumber(),
        rechazados: record.get('rechazados').toNumber(),
        en_proceso: record.get('en_proceso').toNumber(),
        tasa_aceptacion: record.get('tasa_aceptacion')
      }));

    } catch (error) {
      console.error('L [Neo4j] Error getting university conversion rates:', error.message);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * ANALYTICS: Detect communities (groups with similar interests)
   */
  async getCareerClustersByDemographic(demographic = 'provincia') {
    const session = getSession();

    try {
      const query = `
        MATCH (p:Persona)-[:INTERESADO_EN_CARRERA]->(c:Carrera)
        WHERE p.${demographic} IS NOT NULL
        WITH p.${demographic} as grupo, c.categoria as area, count(*) as cantidad
        WHERE cantidad > 1
        RETURN grupo, area, cantidad
        ORDER BY cantidad DESC
        LIMIT 50
      `;

      const result = await session.run(query);

      return result.records.map(record => ({
        grupo: record.get('grupo'),
        area: record.get('area'),
        cantidad: record.get('cantidad').toNumber()
      }));

    } catch (error) {
      console.error('L [Neo4j] Error getting career clusters:', error.message);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * ANALYTICS: Get dropout analysis by stage
   */
  async getDropoutByStage() {
    const session = getSession();

    try {
      const query = `
        MATCH (p:Persona)-[r:INTERESADO_EN_UNIVERSIDAD]->(u:Universidad)
        WITH r.etapa_actual as etapa, count(r) as cantidad
        WHERE etapa IS NOT NULL
        RETURN etapa, cantidad
        ORDER BY cantidad DESC
      `;

      const result = await session.run(query);

      return result.records.map(record => ({
        etapa: record.get('etapa'),
        cantidad: record.get('cantidad').toNumber()
      }));

    } catch (error) {
      console.error('L [Neo4j] Error getting dropout analysis:', error.message);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * ANALYTICS: Get student journey (full path for a specific DNI)
   */
  async getStudentJourney(dni) {
    const session = getSession();

    try {
      const query = `
        MATCH (p:Persona {dni: $dni})
        OPTIONAL MATCH (p)-[r1:INTERESADO_EN_UNIVERSIDAD]->(u:Universidad)
        OPTIONAL MATCH (p)-[r2:INTERESADO_EN_CARRERA]->(c:Carrera)
        RETURN p,
               collect(DISTINCT {universidad: u.nombre, estado: r1.estado, etapa: r1.etapa_actual}) as universidades,
               collect(DISTINCT {carrera: c.nombre, categoria: c.categoria}) as carreras
      `;

      const result = await session.run(query, { dni: dni.toString() });

      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      const persona = record.get('p').properties;

      return {
        persona: {
          dni: persona.dni,
          nombreCompleto: persona.nombreCompleto,
          email: persona.email,
          edad: persona.edad,
          region: persona.region
        },
        universidades: record.get('universidades'),
        carreras: record.get('carreras')
      };

    } catch (error) {
      console.error('L [Neo4j] Error getting student journey:', error.message);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Clear all Neo4j data (for testing/reset)
   */
  async clearAllData() {
    const session = getSession();

    try {
      await session.run('MATCH (n) DETACH DELETE n');
      console.log(' [Neo4j] All data cleared');
      return { success: true };
    } catch (error) {
      console.error('L [Neo4j] Error clearing data:', error.message);
      throw error;
    } finally {
      await session.close();
    }
  }
}

module.exports = new Neo4jService();
