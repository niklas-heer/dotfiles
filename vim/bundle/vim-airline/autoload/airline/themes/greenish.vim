let s:N1 = [ '#141413' , '#88D5DF' , 232 , 149 ] " blackestgravel & lime                                                                                                                                                                                            
let s:N2 = [ '#f4cf86' , '#45413b' , 222 , 236 ] " dirtyblonde    & deepgravel
let s:N3 = [ '#8cffba' , '#242321' , 121 , 234 ] " saltwatertaffy & darkgravel
let s:N4 = [ '#666462' , 241 ]                   " mediumgravel

let s:I1 = [ '#141413' , '#0a9dff' , 232 , 39  ] " blackestgravel & tardis
let s:I2 = [ '#f4cf86' , '#005fff' , 149 , 27  ] " dirtyblonde    & facebook
let s:I3 = [ '#0a9dff' , '#242321' , 39  , 234 ] " tardis         & darkgravel

let s:V1 = [ '#141413' , '#ffa724' , 232 , 214 ] " blackestgravel & orange
let s:V2 = [ '#000000' , '#fade3e' , 16  , 221 ] " coal           & dalespale
let s:V3 = [ '#000000' , '#b88853' , 255 , 235 ] " coal           & toffee
let s:V4 = [ '#c7915b' , 149 , 235]                   " coffee

let s:PA = [ '#f4cf86' , 149 ]                   " dirtyblonde
let s:RE = [ '#ff9eb8' , 44 ]                   " dress

let s:MO = [ '#b5bd68' , 149 ]                   " green

let s:IA = [ s:N3[1] , s:N2[1] , s:N3[3] , s:N2[3] , '' ]

let g:airline#themes#greenish#palette = {}

let g:airline#themes#greenish#palette.accents = {
      \ 'red': [ '#ff2c4b' , '' , 196 , '' , '' ]
      \ }

let g:airline#themes#greenish#palette.normal = airline#themes#generate_color_map(s:N1, s:N2, s:N3)
let g:airline#themes#greenish#palette.normal_modified = {
      \ 'airline_b': [ s:N2[0]   , s:N4[0]   , s:N2[2]   , s:N4[1]   , ''     ] ,
      \ 'airline_c': [ s:MO[0]   , s:N2[1]   , s:MO[1]   , s:N2[3]   , ''     ] }


let g:airline#themes#greenish#palette.insert = airline#themes#generate_color_map(s:I1, s:I2, s:I3)
let g:airline#themes#greenish#palette.insert_modified = {
      \ 'airline_c': [ s:MO[0]   , s:N2[1]   , s:V3[2]   , s:N2[3]   , ''     ] }
let g:airline#themes#greenish#palette.insert_paste = {
      \ 'airline_a': [ s:I1[0]   , s:V2[0]   , s:I1[2]   , s:I1[3]   , ''     ] }


let g:airline#themes#greenish#palette.replace = copy(airline#themes#greenish#palette.insert)
let g:airline#themes#greenish#palette.replace.airline_a = [ s:I1[0] , s:RE[0] , s:I1[2] , s:RE[1] , '' ]
let g:airline#themes#greenish#palette.replace_modified = g:airline#themes#greenish#palette.insert_modified


let g:airline#themes#greenish#palette.visual = airline#themes#generate_color_map(s:V1, s:V2, s:V3)
let g:airline#themes#greenish#palette.visual_modified = {
      \ 'airline_c': [ s:V3[0]   , s:V4[0]   , s:V3[2]   , s:V4[2]   , ''     ] }


let g:airline#themes#greenish#palette.inactive = airline#themes#generate_color_map(s:IA, s:IA, s:IA)
let g:airline#themes#greenish#palette.inactive_modified = {
      \ 'airline_c': [ s:V1[1]   , ''        , s:V1[3]   , ''        , ''     ] }

