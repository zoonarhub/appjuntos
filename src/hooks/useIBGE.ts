import { useState, useEffect } from 'react';

interface Municipio {
  id: number;
  nome: string;
}

export function useIBGE() {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);

  useEffect(() => {
    async function fetchMunicipios() {
      setLoadingMunicipios(true);
      try {
        const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/33/municipios');
        const data = await res.json();
        const sorted = data.sort((a: Municipio, b: Municipio) => a.nome.localeCompare(b.nome));
        setMunicipios(sorted);
      } catch (err) {
        console.error('Erro ao buscar municípios do RJ', err);
      } finally {
        setLoadingMunicipios(false);
      }
    }
    fetchMunicipios();
  }, []);

  return { municipios, loadingMunicipios };
}
