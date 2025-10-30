#!/usr/bin/env python3
"""
Script to add enrollment_workflow to all universities in init-tenants.js
"""

# Public university workflow (compact JSON)
PUBLIC_WORKFLOW = '''enrollment_workflow: {
            stages: [
                { stage_id: 1, name: "Interés Registrado", status_key: "interesado", description: "El aspirante mostró interés inicial", color: "#3B82F6", icon: "user-plus", order: 1, is_initial: true, is_final: false, requires_approval: false, requires_documents: false, requires_payment: false, auto_advance: false, next_stages: [2], allowed_roles: ["admin", "super_admin"] },
                { stage_id: 2, name: "Documentación Pendiente", status_key: "documentacion_pendiente", description: "Esperando que el alumno suba documentación", color: "#F59E0B", icon: "file-text", order: 2, is_initial: false, is_final: false, requires_approval: false, requires_documents: true, requires_payment: false, auto_advance: false, next_stages: [3, 6], allowed_roles: ["admin", "super_admin"] },
                { stage_id: 3, name: "En Revisión", status_key: "en_revision", description: "Documentación siendo revisada por el comité", color: "#8B5CF6", icon: "search", order: 3, is_initial: false, is_final: false, requires_approval: true, requires_documents: true, requires_payment: false, auto_advance: false, next_stages: [4, 6], allowed_roles: ["admin", "super_admin"] },
                { stage_id: 4, name: "Curso de Ingreso", status_key: "curso_ingreso", description: "Alumno cursando el CBC/curso de ingreso", color: "#10B981", icon: "book-open", order: 4, is_initial: false, is_final: false, requires_approval: false, requires_documents: true, requires_payment: false, auto_advance: false, next_stages: [5, 6], allowed_roles: ["admin", "super_admin"] },
                { stage_id: 5, name: "Aceptado", status_key: "aceptado", description: "Aprobó el ingreso, puede matricularse", color: "#22C55E", icon: "check-circle", order: 5, is_initial: false, is_final: true, requires_approval: true, requires_documents: true, requires_payment: false, auto_advance: false, next_stages: [], allowed_roles: ["admin", "super_admin"] },
                { stage_id: 6, name: "Rechazado", status_key: "rechazado", description: "No cumplió con los requisitos", color: "#EF4444", icon: "x-circle", order: 6, is_initial: false, is_final: true, requires_approval: true, requires_documents: false, requires_payment: false, auto_advance: false, next_stages: [], allowed_roles: ["admin", "super_admin"] }
            ],
            default_initial_stage: 1
        },'''

# Private university workflow (compact JSON)
PRIVATE_WORKFLOW = '''enrollment_workflow: {
            stages: [
                { stage_id: 1, name: "Consulta Inicial", status_key: "interesado", description: "El prospecto consultó sobre la carrera", color: "#3B82F6", icon: "user-plus", order: 1, is_initial: true, is_final: false, requires_approval: false, requires_documents: false, requires_payment: false, auto_advance: false, next_stages: [2], allowed_roles: ["admin", "super_admin"] },
                { stage_id: 2, name: "Documentación Solicitada", status_key: "documentacion_pendiente", description: "Se solicitó documentación al postulante", color: "#F59E0B", icon: "file-text", order: 2, is_initial: false, is_final: false, requires_approval: false, requires_documents: true, requires_payment: false, auto_advance: false, next_stages: [3, 7], allowed_roles: ["admin", "super_admin"] },
                { stage_id: 3, name: "Evaluación de Perfil", status_key: "en_revision", description: "Revisión de antecedentes y documentación", color: "#8B5CF6", icon: "search", order: 3, is_initial: false, is_final: false, requires_approval: true, requires_documents: true, requires_payment: false, auto_advance: false, next_stages: [4, 7], allowed_roles: ["admin", "super_admin"] },
                { stage_id: 4, name: "Entrevista Programada", status_key: "entrevista_programada", description: "Entrevista personal agendada", color: "#6366F1", icon: "calendar", order: 4, is_initial: false, is_final: false, requires_approval: false, requires_documents: true, requires_payment: false, auto_advance: false, next_stages: [5, 7], allowed_roles: ["admin", "super_admin"] },
                { stage_id: 5, name: "Evaluación de Beca", status_key: "evaluacion_beca", description: "Evaluando solicitud de beca (si aplica)", color: "#14B8A6", icon: "dollar-sign", order: 5, is_initial: false, is_final: false, requires_approval: true, requires_documents: true, requires_payment: false, auto_advance: false, next_stages: [6, 7], allowed_roles: ["admin", "super_admin"] },
                { stage_id: 6, name: "Admitido", status_key: "aceptado", description: "Admitido, pendiente de pago de matrícula", color: "#22C55E", icon: "check-circle", order: 6, is_initial: false, is_final: false, requires_approval: true, requires_documents: true, requires_payment: true, auto_advance: false, next_stages: [8], allowed_roles: ["admin", "super_admin"] },
                { stage_id: 7, name: "Rechazado", status_key: "rechazado", description: "No admitido", color: "#EF4444", icon: "x-circle", order: 7, is_initial: false, is_final: true, requires_approval: true, requires_documents: false, requires_payment: false, auto_advance: false, next_stages: [], allowed_roles: ["admin", "super_admin"] },
                { stage_id: 8, name: "Matriculado", status_key: "matriculado", description: "Pago realizado, alumno matriculado", color: "#059669", icon: "award", order: 8, is_initial: false, is_final: true, requires_approval: false, requires_documents: true, requires_payment: true, auto_advance: false, next_stages: [], allowed_roles: ["admin", "super_admin"] }
            ],
            default_initial_stage: 1
        },'''

# Map of institution IDs to their type
UNIVERSITIES = {
    "universidad-buenos-aires": "public",  # UBA already has workflow
    "universidad-catolica-argentina": "private",
    "instituto-tecnologico-buenos-aires": "private",
    "universidad-tecnologica-nacional": "public",
    "universidad-palermo": "private",
    "universidad-nacional-la-plata": "public",
    "universidad-argentina-empresa": "private",
    "universidad-austral": "private",
    "universidad-torcuato-di-tella": "private",
    "universidad-nacional-cordoba": "public"
}

def main():
    with open('init-tenants.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Process each university (skip UBA as it already has workflow)
    for inst_id, inst_type in list(UNIVERSITIES.items())[1:]:  # Skip first (UBA)
        workflow = PRIVATE_WORKFLOW if inst_type == "private" else PUBLIC_WORKFLOW

        # Find the position to insert (before "dashboard:")
        search_str = f'institution_id: "{inst_id}"'

        if search_str in content:
            # Find the dashboard section for this institution
            inst_start = content.find(search_str)
            dashboard_start = content.find('dashboard: {', inst_start)

            if dashboard_start != -1:
                # Insert workflow before dashboard
                before = content[:dashboard_start]
                after = content[dashboard_start:]

                content = before + workflow + '\n        ' + after
                print(f"✓ Added {inst_type} workflow to {inst_id}")

    # Write back
    with open('init-tenants.js', 'w', encoding='utf-8') as f:
        f.write(content)

    print("\n✅ All workflows added successfully!")

if __name__ == "__main__":
    main()
