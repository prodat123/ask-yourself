import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://okgfltlneqjglfgqwigw.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rZ2ZsdGxuZXFqZ2xmZ3F3aWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcyOTAyNzQsImV4cCI6MjA0Mjg2NjI3NH0.hJ6XkzyPcRy6fl_S1Rx4xbjYrfezPVV15fqwJDepGog");

function FetchSupabase() {
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    getCountries();
  }, []);

  async function getCountries() {
    const { data } = await supabase.from("countries").select();
    setCountries(data);
  }

  return (
    <ul>
      {countries.map((country) => (
        <li key={country.name}>{country.name}</li>
      ))}
    </ul>
  );
}

export default FetchSupabase;