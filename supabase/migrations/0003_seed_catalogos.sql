-- =====================================================================
--  Migración 0003 — Semilla de catálogos (derivados de hojas DATA/CORREOS)
-- =====================================================================

-- Áreas / Procesos
insert into public.areas (nombre) values
  ('Urgencias'),
  ('Urgencias HD'),
  ('Hospitalización'),
  ('Uci y Ucin'),
  ('Cirugía'),
  ('Central de esterilización'),
  ('Imágenes y cardiología no invasiva'),
  ('Angiografía y Hemodinamia'),
  ('Laboratorio'),
  ('Farmacia'),
  ('Facturación'),
  ('Referencia y Contrareferencia'),
  ('Egreso Seguro'),
  ('Administracion'),
  ('Administrativo'),
  ('Sistemas de información')
on conflict (nombre) do nothing;

-- Cargos del solicitante
insert into public.cargos (nombre) values
  ('Auxiliar de enfermería'),
  ('Enfermeria asistencial'),
  ('Terapia Respiratoria'),
  ('Instrumentación'),
  ('APH'),
  ('Fisioterapia'),
  ('Medicina General'),
  ('Medico Especialista'),
  ('Tecnólogo en radiología'),
  ('Auxiliar de Farmacia'),
  ('Auxiliar de facturación'),
  ('Administrativo'),
  ('Camillero'),
  ('Fonoaudiología'),
  ('Orientadores'),
  ('Terapia Ocupacional'),
  ('Auxiliar Roperia')
on conflict (nombre) do nothing;

-- Turnos
insert into public.turnos (nombre, orden) values
  ('Día', 1),
  ('Noche', 2),
  ('Día (12 horas)', 3),
  ('Noche (12 horas)', 4),
  ('Mañana (8 horas)', 5),
  ('Tarde (8 horas)', 6),
  ('Noche (8 horas)', 7)
on conflict (nombre) do nothing;

-- Coordinadores / aprobadores (origen: hoja CORREOS)
insert into public.coordinadores (area_id, cargo, nombre, correo, link) values
  ((select id from public.areas where nombre='Angiografía y Hemodinamia'), 'Coordinador Angiografía y Hemodinamia', 'Mirley Avendaño', 'coordinacionenfermeria.angiografia@cacsantabarbara.co', 'https://shre.ink/QDH3'),
  ((select id from public.areas where nombre='Central de esterilización'), 'Coordinador Central de esterilización', 'Rocio Vallejo', 'coordinacion.esterilizacion@cacsantabarbara.co', 'https://shre.ink/QDHt'),
  ((select id from public.areas where nombre='Cirugía'), 'Coordinador enfermería Cirugía', 'Jennifer Rodriguez', 'coordinacionenfermeria.cirugia@cacsantabarbara.co', 'https://shre.ink/QDHW'),
  ((select id from public.areas where nombre='Cirugía'), 'Coordinador médico Cirugía', 'Carlos Dallos', 'carlos.dallos@cacsantabarbara.co', 'https://shre.ink/QDxw'),
  ((select id from public.areas where nombre='Facturación'), 'Coordinador Facturación', 'Argemiro Adrade', 'facturacion.cacsb@cacsantabarbara.co', 'https://shre.ink/QDxv'),
  ((select id from public.areas where nombre='Hospitalización'), 'Coordinador enfermería Hospitalización', 'Claudia Posso', 'coordinacionenfermeria.hospitalizacion@cacsantabarbara.co', 'https://shre.ink/QDxM'),
  ((select id from public.areas where nombre='Hospitalización'), 'Coordinador rehabilitación', 'Paola Chacon', 'coordinacionrehabilitacion.cacsb@cacsantabarbara.co', 'https://shre.ink/QDKT'),
  ((select id from public.areas where nombre='Hospitalización'), 'Coordinador médico Hospitalización', 'Eva Liliana Restrepo', 'coordinacionmedica.hospitalizacion@cacsantabarbara.co', 'https://shre.ink/QDxB'),
  ((select id from public.areas where nombre='Imágenes y cardiología no invasiva'), 'Coordinador enfermería Imágenes', 'Juliana Acosta', 'coordinacion.imagenes@cacsantabarbara.co', 'https://shre.ink/QDB2'),
  ((select id from public.areas where nombre='Laboratorio'), 'Coordinador Laboratorio', 'Isgleidys Rodriguez', 'isgleidis.rodriguez@cacsantabarbara.co', 'https://shre.ink/QDBi'),
  ((select id from public.areas where nombre='Uci y Ucin'), 'Coordinador enfermería Uci y Ucin', 'Paula Arango', 'coordinacionenfermeria.uci@cacsantabarbara.co', 'https://shre.ink/QDBj'),
  ((select id from public.areas where nombre='Uci y Ucin'), 'Coordinador médico Uci y Ucin', 'Harold Arboleda', 'harold.arboleda@cacsantabarbara.co', 'https://shre.ink/QDBx'),
  ((select id from public.areas where nombre='Uci y Ucin'), 'Coordinador rehabilitación', 'Paola Chacon', 'coordinacionrehabilitacion.cacsb@cacsantabarbara.co', 'https://shre.ink/QDKT'),
  ((select id from public.areas where nombre='Urgencias'), 'Coordinador enfermería Urgencias', 'Mayra Lerma', 'coordinacion.enfermeriaurgencias@cacsantabarbara.co', null),
  ((select id from public.areas where nombre='Urgencias'), 'Coordinador médico Pediatría', 'Catalina Romero', 'catalina.romero@cacsantabarbara.co', 'https://shre.ink/QDKd'),
  ((select id from public.areas where nombre='Urgencias'), 'Coordinador rehabilitación', 'Paola Chacon', 'coordinacionrehabilitacion.cacsb@cacsantabarbara.co', 'https://shre.ink/QDKT'),
  ((select id from public.areas where nombre='Urgencias'), 'Coordinador médico Urgencias', 'Angelica Arizabaleta', 'angelica.arizabaleta@cacsantabarbara.co', 'https://shre.ink/QDQZ'),
  ((select id from public.areas where nombre='Urgencias HD'), 'Coordinador enfermería Urgencias HD', 'Ximena Largacha', 'lider.hospitalizacionparcial@cacsantabarbara.co', null),
  ((select id from public.areas where nombre='Sistemas de información'), 'Soporte GE2', 'Administrador', 'juangabriel.cuervo@cacsantabarbara.co', null),
  ((select id from public.areas where nombre='Referencia y Contrareferencia'), 'Lider de Referencia y Contrareferencia', 'Karol Vasquez', 'lider.referencia@cacsantabarbara.co', 'https://shre.ink/rryI'),
  ((select id from public.areas where nombre='Egreso Seguro'), 'Coordinadora Egreso Seguro', 'Geraldine Garcia Sandoval', 'lider.gestiontransversal@cacsantabarbara.co', 'https://shre.ink/rryB'),
  ((select id from public.areas where nombre='Administracion'), 'Coordinacion Admistrativa', 'Martha Arevalo Posada', 'coordinacion.admiistrativa@cacsantabarbara.co', 'https://tinyurl.com/25aw46w6'),
  ((select id from public.areas where nombre='Farmacia'), 'Coordinador Gestión Farmacéutica', 'Carolina Burbano Pérez', 'coordinaciongestionfarmaceutica@cacsantabarbara.co', null)
on conflict do nothing;
