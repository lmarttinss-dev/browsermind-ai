export type ProductBrief = {
 version:1; generatedAt:string; sourceUrl:string; summary:string; audience:string|null;
 characteristics:{name:string;value:string}[];
 benefits:{text:string;evidence:string;frequency:string|null}[];
 concerns:{text:string;evidence:string;frequency:string|null}[];
 questions:{question:string;answer:string|null;evidence:string}[];
 improvements:{text:string;basis:string}[];
 limitations:string[];
};
