/**
 * Testimonials Service
 * Reads/writes directly from the Supabase `testimonials` table.
 */

import { supabase } from "./supabase/client";

export interface Testimonial {
  id: string;
  client_name: string;
  property_bought: string;
  property_location: string;
  rating: number;
  review: string;
  occupation?: string;
  client_photo?: string;
  video_url?: string;
  created_at: string;
  updated_at: string;
}

export const testimonialsService = {
  async getAll(): Promise<Testimonial[]> {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async getAllAdmin(): Promise<Testimonial[]> {
    return testimonialsService.getAll();
  },

  async create(
    testimonialData: Omit<Testimonial, "id" | "created_at" | "updated_at">
  ): Promise<Testimonial> {
    const { data, error } = await supabase
      .from("testimonials")
      .insert([testimonialData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async update(
    id: string,
    testimonialData: Partial<Testimonial>
  ): Promise<Testimonial> {
    const { data, error } = await supabase
      .from("testimonials")
      .update({ ...testimonialData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("testimonials")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  },
};
