import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

interface DecodedToken {
  role: string;
  username: string;
  userId: string;
}

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      try {
        const decoded = jwtDecode(token) as DecodedToken;
        setRole(decoded.role);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  return role;
}
