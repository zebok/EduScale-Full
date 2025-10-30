import { useCallback } from "react";

const BASE_URL = "http://localhost:5001";

/**
 * Custom hook that encapsulates all communication with the Enrollment backend.
 *
 * Exposes:
 * - createEnrollment(data)
 * - getEnrollmentsByInstitution(institucion)
 * - getEnrollmentHistory(institucion, email)
 */
export default function useEnrollmentAPI() {
  const createEnrollment = useCallback(async (data) => {
    try {
      const resp = await fetch(`${BASE_URL}/api/enrollment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const text = await resp.text();
      // Try to parse JSON if possible
      let body;
      try {
        body = text ? JSON.parse(text) : null;
      } catch (e) {
        body = text;
      }

      if (!resp.ok) {
        const error = (body && body.error) || body || resp.statusText || "Unknown error";
        return { ok: false, error };
      }

      return { ok: true, body };
    } catch (error) {
      return { ok: false, error: error.message || String(error) };
    }
  }, []);

  const getEnrollmentsByInstitution = useCallback(async (institucion) => {
    try {
      const resp = await fetch(`${BASE_URL}/api/enrollment/institucion/${encodeURIComponent(institucion)}`);
      if (!resp.ok) {
        return [];
      }
      const json = await resp.json();
      // Expecting an array or object with inscripciones
      if (Array.isArray(json)) return json;
      if (Array.isArray(json.inscripciones)) return json.inscripciones;
      return [];
    } catch (error) {
      // On error, return empty array as specified
      return [];
    }
  }, []);

  const getEnrollmentHistory = useCallback(async (institucion, email) => {
    try {
      const url = `${BASE_URL}/api/enrollment/institucion/${encodeURIComponent(institucion)}/email/${encodeURIComponent(
        email
      )}`;
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const json = await resp.json();
      return json ?? null;
    } catch (error) {
      return null;
    }
  }, []);

  return {
    createEnrollment,
    getEnrollmentsByInstitution,
    getEnrollmentHistory,
  };
}
