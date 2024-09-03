import { ClassNameValue, twMerge } from 'tailwind-merge';

export const cn = (...classNames: ClassNameValue[]) => {
    return twMerge(classNames);
};
