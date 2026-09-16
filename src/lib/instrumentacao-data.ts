import { supabase } from "./supabase";

export type CloudInstrument = {
  id: string;
  code: string;
  name: string;
  sector: string | null;
  status: "Ativo" | "Manutenção" | "Inativo";
  next_calibration: string | null;
};

export type CloudCalibration = {
  id: string;
  instrument_id: string | null;
  instrument_label: string;
  calibration_date: string;
  result: "Aprovado" | "Reprovado";
  next_date: string | null;
  technician: string | null;
};

export async function listInstruments() {
  const { data, error } = await supabase
    .from("instruments")
    .select("id, code, name, sector, status, next_calibration")
    .order("code");
  if (error) throw error;
  return (data ?? []) as CloudInstrument[];
}

export async function createInstrument(input: Omit<CloudInstrument, "id">) {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("instruments")
    .insert({ ...input, created_by: userData.user?.id ?? null })
    .select("id, code, name, sector, status, next_calibration")
    .single();
  if (error) throw error;
  return data as CloudInstrument;
}

export async function updateInstrument(id: string, input: Partial<Omit<CloudInstrument, "id">>) {
  const { data, error } = await supabase
    .from("instruments")
    .update(input)
    .eq("id", id)
    .select("id, code, name, sector, status, next_calibration")
    .single();
  if (error) throw error;
  return data as CloudInstrument;
}

export async function deleteInstrument(id: string) {
  const { error } = await supabase.from("instruments").delete().eq("id", id);
  if (error) throw error;
}

export async function listCalibrations() {
  const { data, error } = await supabase
    .from("calibrations")
    .select("id, instrument_id, instrument_label, calibration_date, result, next_date, technician")
    .order("calibration_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CloudCalibration[];
}

export async function createCalibration(input: Omit<CloudCalibration, "id">) {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("calibrations")
    .insert({ ...input, created_by: userData.user?.id ?? null })
    .select("id, instrument_id, instrument_label, calibration_date, result, next_date, technician")
    .single();
  if (error) throw error;
  return data as CloudCalibration;
}
