const a = 42;

export const exampleFun02 = () => {
  return { text: `This is fun ${a} @ ${new Date()}!` };
};

export const exampleFun03 = ({ prefix }: { prefix: string }) => {
  return { text: `${prefix} This is fun ${a} @ ${new Date()}!` };
};
