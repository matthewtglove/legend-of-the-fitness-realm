import prettier from 'prettier/standalone';
import type prettierType from 'prettier';
import parserBabel from 'prettier/plugins/babel';
import parserEstree from 'prettier/plugins/estree';
import * as prettierPluginGlsl from 'prettier-plugin-glsl';
import parserMarkdown from 'prettier/plugins/markdown';
import parserTypescript from 'prettier/plugins/typescript';

interface FormatCodeOptions {
  code: string;
  language: string;

  prettierOptions?: prettierType.Options;
}

interface FormatResult {
  formattedCode?: string;
  error?: string;
}

const defaultPrettierOptions: prettierType.Options = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: `es5`,
};

export const formatCodeWithPrettier = async ({
  code,
  language,
  prettierOptions = {},
}: FormatCodeOptions): Promise<FormatResult> => {
  let parser: string;
  const plugins: prettierType.Plugin[] = [];

  switch (language) {
    case `glsl`:
      parser = `glsl`;
      plugins.push(prettierPluginGlsl as prettierType.Plugin);
      break;
    case `markdown`:
      parser = `markdown`;
      plugins.push(parserMarkdown as prettierType.Plugin);
      break;
    case `typescript`:
      parser = `typescript`;
      plugins.push(parserTypescript as prettierType.Plugin, parserEstree);
      break;
    default:
      parser = `babel`;
      plugins.push(parserBabel, parserEstree);
      break;
  }

  try {
    const options: prettierType.Options = {
      ...defaultPrettierOptions,
      ...prettierOptions,
      parser,
      plugins,
      ...(language === `typescript` ? { filepath: `file.tsx` } : {}),
    };

    console.log(`Prettier formatting options:`, { options, parserTypescript, parserEstree });

    const formattedCode = await prettier.format(code, options);
    return { formattedCode };
  } catch (error: unknown) {
    console.error(`Prettier formatting error:`, error);
    return { error: (error as { message?: string }).message || `Failed to format code.` };
  }
};

export const getDefaultPrettierOptions = (): prettierType.Options => ({
  ...defaultPrettierOptions,
});
