import { useNavigate } from "react-router-dom";

export function useNavigateAdapter() {
  const navigate = useNavigate();

  return (page: string) => {
    navigate(`/${page}`);
  };
}
