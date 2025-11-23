
import { Grade } from './types';

export const GRADE_OPTIONS = [
  { value: Grade.Excelent, label: 'Excel·lent' },
  { value: Grade.Notable, label: 'Notable' },
  { value: Grade.Satisfactori, label: 'Satisfactori' },
  { value: Grade.NoAssolit, label: 'No Assolit' },
];

export const GENERAL_REPORT_CLOSURES = {
    POSITIVE: [
        "Al llarg d’aquest trimestre, (Nom) ha mostrat implicació i avenços en el seu procés d’aprenentatge. Continuarem acompanyant-lo/la per seguir creixent i descobrint noves possibilitats. Agraïm a la família la seva col·laboració i suport. Enhorabona per la feina feta!",
        "Ha estat un trimestre ple de descobriments i creixement per a (Nom). Continuarem treballant junts per potenciar la seva autonomia, curiositat i benestar a l’aula. Gràcies a la família pel seu acompanyament constant.",
        "(Nom) continua construint aprenentatges significatius i desenvolupant habilitats fonamentals. Valorem molt el seu esforç i la col·laboració de la família. Confiem que el proper trimestre segueixi avançant amb la mateixa il·lusió.",
        "Estem molt contents amb l’evolució de (Nom) durant aquest trimestre. La seva participació, interès i ganes d’aprendre són aspectes que continuarem reforçant. Moltes gràcies a les famílies pel seu suport i proximitat."
    ],
    NEEDS_REINFORCEMENT: [
        "Al llarg d’aquest trimestre, (Nom) ha mostrat petites millores i continua en procés d’adquisició de diferents aprenentatges. Seguirem treballant conjuntament amb la família per reforçar la seva seguretat, atenció i autonomia. Amb constància i suport, confiem que continuarà avançant de manera positiva.",
        "(Nom) necessita continuar reforçant algunes àrees, però mostra disposició per millorar quan compta amb un acompanyament proper. Agraïm la col·laboració de la família i continuarem oferint estratègies perquè avanci amb més confiança el proper trimestre.",
        "Tot i que aquest trimestre ha suposat alguns reptes per a (Nom), ha assolit progressos que valorem molt. El continuarem recolzant perquè desenvolupi noves habilitats i guanyi autonomia. Gràcies a la família per la seva implicació i per caminar al nostre costat en aquest procés.",
        "(Nom) continua construint els seus aprenentatges i necessita suport per consolidar-los. Estem segurs que, amb el treball conjunt entre escola i família, podrà continuar avançant de manera gradual i positiva. Agraïm el compromís familiar."
    ]
};

export const DEFAULT_STYLE_EXAMPLES = `
EXEMPLE 1 (Aspectes Personals):
"Al llarg d’aquest trimestre hem observat un bon progrés del Marcos tant en el seu desenvolupament acadèmic com personal. Pel que fa al procés d’aprenentatge, el Marcos s’ha mostrat molt treballador, participatiu i constant. Ha demostrat interès per les activitats proposades i ha mantingut una actitud positiva i responsable davant les diferents tasques. Sap organitzar-se bé i acostuma a finalitzar les feines amb cura i esforç. En l’àmbit personal i social, és un alumne col·laborador i amb una bona predisposició per ajudar quan se li demana. Manté una relació correcta amb els companys i respecta les normes del grup, tot i que encara pot millorar una mica la seva empatia en algunes situacions. En conjunt, ha estat un trimestre molt positiu, on el Marcos ha mostrat una evolució notable i una actitud que afavoreix el bon clima a l’aula."

EXEMPLE 2 (Llengua Catalana):
"En Marcos ha assolit força bé els continguts treballats. Destaca per un progrés significatiu en la velocitat lectora, comprensió i interès per agafar i llegir llibres de la biblioteca. La seva expressió oral ha millorat, destacant en activitats preparades, si bé pot aprofundir en la complexitat de les frases quan fa una conversa espontània. En l'escriptura està consolidant els aspectes gramaticals i fa frases elaborades, però quan ha de fer redactats li costa posar el punt per anar separant les frases. A més, de vegades separa paraules i aquest aspecte hauria d'estar assolit."

EXEMPLE 3 (Aspectes Personals - To molt positiu):
"Al llarg d’aquest trimestre, hem observat un molt bon progrés en el Dylan, tant en el desenvolupament acadèmic com en el seu creixement personal i social. Des del primer dia s’ha mostrat còmode, content i motivat. Pel que fa al procés d’aprenentatge, ha mostrat una evolució molt positiva i una bona predisposició per aprendre. Presenta les tasques de manera força correcta i és capaç d’acceptar les orientacions de l’adult. Quant al desenvolupament personal, és un alumne autònom, responsable i organitzat. En conjunt, estem molt contents amb la seva evolució i actitud, i l’animem a continuar treballant amb la mateixa il·lusió i esforç. Endavant, Dylan, continua així!"

EXEMPLE 4 (Educació Física):
"En Dylan és un alumne amb moltes qualitats en l’àmbit físic i esportiu. Presenta molt bones capacitats motrius i destaca en la realització de les activitats. Participa amb entusiasme i mostra gran domini i habilitat en el moviment. En general participa activament, respecta les normes i manté una actitud positiva cap als companys. A la piscina, demostra seguretat, habilitat i una gran motivació. Pel que fa als hàbits d'higiene aquest trimestre ha fet una excel·lent rutina portant la roba de recanvi."
`;