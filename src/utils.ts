export const formatarMoeda = (valor: number): string => {
  return (valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

export const formatarCNPJ = (cnpj: string): string => {
  const limpo = (cnpj || '').replace(/\D/g, '');
  if (limpo.length !== 14) return cnpj;
  return limpo.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
};

export const formatarData = (dataStr: string): string => {
  if (!dataStr) return '';
  const partes = dataStr.split('-');
  if (partes.length !== 3) return dataStr;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

export const formatarTelefone = (tel: string): string => {
  const limpo = (tel || '').replace(/\D/g, '');
  if (limpo.length === 11) {
    return limpo.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  } else if (limpo.length === 10) {
    return limpo.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return tel;
};
