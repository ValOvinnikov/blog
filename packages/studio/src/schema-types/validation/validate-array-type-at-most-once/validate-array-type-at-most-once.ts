type TArrayMember = { _type?: unknown };

export const validateArrayTypeAtMostOnce =
  (type: string, message: string) =>
  (members: TArrayMember[] | undefined): string | true => {
    const count = (members ?? []).filter(
      (member) => member._type === type,
    ).length;

    return count > 1 ? message : true;
  };
