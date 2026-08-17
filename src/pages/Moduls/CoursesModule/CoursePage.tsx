import { useEffect, useRef, useState } from "react";
import {  
  Calendar,
  User,
  Users,
  Scan,
  Fingerprint,
  Scale,
  ChevronRight, 
  BookOpenText
} from 'lucide-react';
import { useTheme } from "../../../contexts/ThemeContext"; // Adjust path as needed

export type Topic = {
  id: string;
  title: string;
  note:string;
  paragraphs?: string[];
  bullets?: string[];
  table?: {
    year: string;
    description: string;
  }[];
};

type Module = {
  id: string;
  title: string;
  contentTitle: string;
  icon: React.ReactNode;
  topics: Topic[];
};

// Icon components for each module
const moduleIcons = {
  1: <BookOpenText size={25} className="text-white" />,
  2: <Fingerprint size={25} className="text-white" />,
  3: <Calendar size={25} className="text-white" />,
  4: <User size={25} className="text-white" />,
  5: <Users size={25} className="text-white" />,
  6: <Scan size={25} className="text-white" />,
  7: <Fingerprint size={25} className="text-white" />,
  8: <Scale size={25} className="text-white" />,
  9: <Scale size={25} className="text-white" />,
};

const modules: Module[] = Array.from({ length: 9 }).map((_, i) => {
  const moduleNumber = i + 1;

  const moduleData: Record<number, Module> = {
    1: {
      id: `module-${moduleNumber}`,
      title: `Module ${moduleNumber}`,
      contentTitle: "Forensic Odontology",
      icon: moduleIcons[1],
      topics: [
        {
          id: `m${moduleNumber}-intro`,
          title: "Forensic Odontology",
          paragraphs: [
            "As the modern age advances, so are the heinous crimes and violent activities. The occurrence of such incidences may significantly ruin the lives of victims, their family and friends. The conviction of the criminal is mandatory to curb such activities in society. Forensic Odontology plays a significant and crucial role in solving such criminal cases. The recent advancements in technology will lead to a great increase in the aspects of forensic training. With this extensive progress, police officials and law experts have started recognizing the vital role that dental evidence can play in the investigation. The chapter focus on the career and scope of forensic odontology, the qualifications required to become a forensic odontologist, the major roles and duties performed by the odontologist while investigating a case, understanding the medico-legal importance of the evidence recovered from the crime scene followed by their analysis.",
            "This branch of Forensic Science is also known as Forensic Dentistry because it gives a cumulative outline of dentistry to the law. This branch of forensic dentistry include handling, examination and thorough evaluation of dental clues available to the odontologists and presenting the same in the criminal and civil legal proceedings.",
            "From the past 3 decades, a large number of aspiring dentists have come across the importance of dentistry to the legal aspects, but there are many institutions and universities of United States and Europe which lacks proper education curricula in this field. It mainly focuses on an individual's dentition and aids in the identification and individualization of unrecognized remains or multiple casualties in both natural and man-made calamities by traditional methods and techniques. It accounts for a skillful blend of knowledge of dentition, its developmental anomalies, histology and pathology. These traits require a good acquaintance with the law as well. Human individualization and injury analysis were the only areas which the experts of this field classically dealt with. But today, it expands to manifolds sectors like- child misuse, domestic violence, ethics etc."
          ],
          bullets: [
            "Putrefaction",
            "Heat",
            "Water soaking",
            "Desiccation",
            "Act as a source od DNA - nuclear or mitochondrial DNA (found in dental pulp or crushed tooth)"
          ],
            note:"Forensic Dentistry is an emerging field and has gained popularity because of the major landmark events that occurred and significantly shaped this field for application as a crucial scientific tool within the legal community.",
        },
        {
          id: `m${moduleNumber}-history`,
          title: "History",
          paragraphs: [
            "The firmest of all substances are the dental tissues, which resist putrefaction and thus are considered to be the most crucial evidence.",
            "The following table reflects the crucial events that have occurred in the history of forensic odontology.",
          ],
          table: [
            {
              year: "2650 BC",
              description: "Hesi-Re was known to be the first dentist",
            },
            {
              year: "1st century A.D.",
              description:
                "First record of Forensic Dental Recognition – The discolored anterior tooth of Emperor Claudius led to its successful investigation.",
            },
            {
              year: "1066 A.D.",
              description:
                "Identification was done by outlining the misaligned tooth of King William when he sealed a mail by biting soft sealing wax.",
            },
            {
              year: "1453",
              description:
                "First Dental Identification was reported and John Talbot was identified who was famous by the name – Earl of Shrewsbury.",
            },
            {
              year: "1692",
              description:
                "The science of bite marks became handy in criminal trials for identifying the offender – George Burroughs.",
            },
            {
              year: "1776",
              description:
                "In US, Paul Revere identified the body of Dr. Joseph Warren from bite marks.",
            },
          ],
          note:""
        },
        {
          id: `m${moduleNumber}-case-studies`,
          title: "Case Studies",
          paragraphs: ["Important real-world cases solved using dental evidence."],
          note:""
        }
      ],
    },
    2: {
      id: `module-${moduleNumber}`,
      title: `Module ${moduleNumber}`,
      contentTitle: "Bite Mark Analysis",
      icon: moduleIcons[2],
      topics: [
        {
          id: `m${moduleNumber}-intro`,
          title: "Introduction to Bite Marks",
          paragraphs: [
            "Module 2 focuses entirely on bite mark evidence.",
            "You will understand how bite marks are examined and compared."
          ],
          bullets: ["Types of bite marks", "Comparison methods", "Pattern recognition"],
                note:"",
        },
        {
          id: `m${moduleNumber}-history`,
          title: "Historical Cases",
          paragraphs: ["Famous bite mark identification cases."],
                note:"",
        },
        {
          id: `m${moduleNumber}-case-studies`,
          title: "Case Studies",
          paragraphs: ["Real investigations involving bite mark analysis."],
                note:"",
        }
      ],
    },
    3: {
      id: `module-${moduleNumber}`,
      title: `Module ${moduleNumber}`,
      contentTitle: "Age Estimation",
      icon: moduleIcons[3],
      topics: [
        {
          id: `m${moduleNumber}-intro`,
          title: "Introduction to Age Estimation",
          paragraphs: [
            "Module 3 teaches age estimation using dental development.",
            "Methods include eruption sequence, attrition and radiographic techniques."
          ],
          bullets: ["Tooth eruption chart", "Attrition levels", "Radiographic age estimation"],
                note:"",
        },
        {
          id: `m${moduleNumber}-history`,
          title: "Evolution of Methods",
          paragraphs: ["Development of scientific approaches in age estimation."],
                note:"",
        },
        {
          id: `m${moduleNumber}-case-studies`,
          title: "Case Studies",
          paragraphs: ["Cases where dental age estimation helped establish identity."],
                note:"",
        }
      ],
    },
    4: {
      id: `module-${moduleNumber}`,
      title: `Module ${moduleNumber}`,
      contentTitle: "Human Identification",
      icon: moduleIcons[4],
      topics: [
        {
          id: `m${moduleNumber}-intro`,
          title: "Human Identification via Dentition",
          paragraphs: [
            "Module 4 explains how teeth play a major role in identifying unknown individuals.",
            "Dental comparison, restorations, and unique patterns are covered."
          ],
                note:"",
        },
        {
          id: `m${moduleNumber}-history`,
          title: "Old Identification Methods",
          paragraphs: ["Ancient identification techniques using teeth."],
                note:"",
        },
        {
          id: `m${moduleNumber}-case-studies`,
          title: "Case Studies",
          paragraphs: ["Identification cases using dental records."],
                note:"",
        }
      ],
    },
    5: {
      id: `module-${moduleNumber}`,
      title: `Module ${moduleNumber}`,
      contentTitle: "Disaster Victim Identification (DVI)",
      icon: moduleIcons[5],
      topics: [
        {
          id: `m${moduleNumber}-intro`,
          title: "DVI Basics",
          paragraphs: [
            "Module 5 explains the DVI process in natural and man-made disasters.",
            "Teeth survive extreme conditions making them key identifiers."
          ],
          bullets: ["DVI phases", "Dental charting", "Post-mortem vs ante-mortem comparison"],
                note:"",
        },
        {
          id: `m${moduleNumber}-history`,
          title: "Major DVI Events",
          paragraphs: ["Historic mass disaster cases and lessons learned."],
                note:"",
        },
        {
          id: `m${moduleNumber}-case-studies`,
          title: "Case Studies",
          paragraphs: ["Earthquake, air-crash and fire accident identification cases."],
                note:"",
        }
      ],
    },
    6: {
      id: `module-${moduleNumber}`,
      title: `Module ${moduleNumber}`,
      contentTitle: "Forensic Dental Radiology",
      icon: moduleIcons[6],
      topics: [
        {
          id: `m${moduleNumber}-intro`,
          title: "Radiology Basics",
          paragraphs: [
            "Module 6 covers X-ray interpretation in forensic dentistry.",
            "Radiographs help with comparisons and dental pattern analysis."
          ],
                note:"",
        },
        {
          id: `m${moduleNumber}-history`,
          title: "Radiology Evolution",
          paragraphs: ["Advancements in radiographic techniques."],
                note:"",
        },
        {
          id: `m${moduleNumber}-case-studies`,
          title: "Case Studies",
          paragraphs: ["Cases solved using radiographic comparison."],
                note:"",
        }
      ],
    },
    7: {
      id: `module-${moduleNumber}`,
      title: `Module ${moduleNumber}`,
      contentTitle: "Pattern Analysis",
      icon: moduleIcons[7],
      topics: [
        {
          id: `m${moduleNumber}-intro`,
          title: "Pattern Recognition",
          paragraphs: [
            "Module 7 covers analyzing unique dental patterns.",
            "Focus on wear patterns, fillings, and restorations."
          ],
                note:"",
        },
        {
          id: `m${moduleNumber}-history`,
          title: "Development",
          paragraphs: ["How pattern recognition became part of forensics."],
                note:"",
        },
        {
          id: `m${moduleNumber}-case-studies`,
          title: "Case Studies",
          paragraphs: ["Cases solved solely using dental pattern recognition."],
                note:"",
        }
      ],
    },
    8: {
      id: `module-${moduleNumber}`,
      title: `Module ${moduleNumber}`,
      contentTitle: "Legal & Ethical Aspects",
      icon: moduleIcons[8],
      topics: [
        {
          id: `m${moduleNumber}-intro`,
          title: "Legal Overview",
          paragraphs: [
            "Module 8 explains the legal procedures for presenting dental evidence in court.",
            "Covers ethics, expert witness rules, and admissibility."
          ],
                note:"",
        },
        {
          id: `m${moduleNumber}-history`,
          title: "Law Evolution",
          paragraphs: ["How forensic odontology became admissible in court."],
                note:"",
        },
        {
          id: `m${moduleNumber}-case-studies`,
          title: "Case Studies",
          paragraphs: ["Court cases involving dental experts."],
                note:"",
        }
      ],
    },
        9: {
      id: `module-${moduleNumber}`,
      title: `Module ${moduleNumber}`,
      contentTitle: "Legal & Ethical Aspect",
      icon: moduleIcons[9],
      topics: [
        {
          id: `m${moduleNumber}-intro`,
          title: "Legal Overview",
          paragraphs: [
            "Module 8 explains the legal procedures for presenting dental evidence in court.",
            "Covers ethics, expert witness rules, and admissibility."
          ],
                note:"",
        },
        {
          id: `m${moduleNumber}-history`,
          title: "Law Evolution",
          paragraphs: ["How forensic odontology became admissible in court."],
                note:"",
        },
        {
          id: `m${moduleNumber}-case-studies`,
          title: "Case Studies",
          paragraphs: ["Court cases involving dental experts."],
                note:"",
        }
      ],
    }
  };

  return moduleData[moduleNumber];
});

export default function CoursePage() {
  const { isDark } = useTheme();
  const [active, setActive] = useState<number>(0);
  const [selectedTopicMap, setSelectedTopicMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    modules.forEach((m) => (map[m.id] = m.topics[0].id));
    return map;
  });

  const modulesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const moduleId = modules[active].id;
    setSelectedTopicMap((prev) => {
      if (prev[moduleId]) return prev;
      return { ...prev, [moduleId]: modules[active].topics[0].id };
    });
  }, [active]);

  useEffect(() => {
    const container = modulesRef.current;
    if (!container) return;
    const btn = container.querySelector<HTMLButtonElement>(`button[data-index="${active}"]`);
    if (!btn) return;

    const btnRect = btn.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();

    if (btnRect.left < contRect.left || btnRect.right > contRect.right) {
      const scrollLeft = btn.offsetLeft - container.clientWidth / 2 + btn.clientWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [active]);

  function handleNext() {
    setActive((s) => Math.min(modules.length - 1, s + 1));
  }

  const currentModule = modules[active];
  const selectedTopicId = selectedTopicMap[currentModule.id] ?? currentModule.topics[0].id;
  const currentTopic = currentModule.topics.find((t) => t.id === selectedTopicId) ?? currentModule.topics[0];

  function onTopicChange(topicId: string) {
    setSelectedTopicMap((s) => ({ ...s, [currentModule.id]: topicId }));
  }

  return (
    <div className="mx-auto rounded-lg">
      <h2 className={`text-lg md:text-xl font-bold mb-4 ${
        isDark ? "text-white" : "text-slate-900"
      }`}>
        Advanced Certificate Course in Forensic Odontology
      </h2>

      {/* Module buttons with scroll */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 overflow-hidden relative">
          <div ref={modulesRef} className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
            {modules.map((m, i) => (
              <button
                key={m.id}
                data-index={i}
                onClick={() => setActive(i)}
                className={`whitespace-nowrap px-6 py-2 rounded-md text-[16px] font-bold border flex items-center gap-2 cursor-pointer transition-colors duration-200 ${
                  i === active 
                    ? "bg-sky-600 text-white border-sky-600" 
                    : isDark
                      ? "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
                      : "bg-white text-[#B1B1B1] border-[#B1B1B1] hover:bg-gray-50"
                }`}
              >
                {m.title}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            aria-label="next module" 
            onClick={handleNext} 
            className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={active === modules.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Topic dropdown for current module */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1 max-w-xs">
          <label htmlFor="topic-select" className="sr-only">Select topic</label>
          <select
            id="topic-select"
            value={selectedTopicId}
            onChange={(e) => onTopicChange(e.target.value)}
            className={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
              isDark
                ? "bg-gray-800 border-gray-600 text-white focus:border-sky-500"
                : "bg-white border-gray-300 text-gray-900 focus:border-sky-500"
            }`}
          >
            {currentModule.topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Module content */}
      <div className="pt-6">
        <h3 className={`text-lg font-semibold mb-3 ${
          isDark ? "text-white" : "text-gray-900"
        }`}>
          Module {active + 1} - {currentModule.contentTitle}
        </h3>

        <article className={`rounded-md ${
          isDark ? "bg-gray-800" : "bg-white"
        }`}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#E28F1D] flex items-center justify-center flex-shrink-0">
              {currentModule.icon}
            </div>

            <div className="flex-1">
              <h4 className={`font-semibold mb-4 text-lg ${
                isDark ? "text-white" : "text-slate-800"
              }`}>
                {currentTopic.title}
              </h4>
              <div className={`space-y-4 ${
                isDark ? "text-gray-300" : "text-slate-600"
              }`}>
                {currentTopic.paragraphs?.map((p, idx) => (
                  <p key={idx} className="leading-relaxed text-sm">{p}</p>
                ))}

                {currentTopic.bullets && (
                  <div>
                    <p className={`font-medium mb-2 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}>
                      Significance of Teeth – as an evidence
                    </p>
                    <ul className="list-disc ml-5 space-y-2">
                      {currentTopic.bullets.map((b, i) => (
                        <li key={i} className={`text-sm ${
                          isDark ? "text-gray-300" : "text-slate-600"
                        }`}>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentTopic.table && (
                  <div className="mt-4">
                    <table className={`w-full border-collapse border text-sm ${
                      isDark 
                        ? "border-gray-600 text-gray-300" 
                        : "border-slate-300 text-slate-600"
                    }`}>
                      <thead>
                        <tr className={isDark ? "bg-gray-700" : "bg-slate-100"}>
                          <th className={`border px-4 py-2 text-left ${
                            isDark ? "border-gray-600" : "border-slate-300"
                          }`}>
                            Year
                          </th>
                          <th className={`border px-4 py-2 text-left ${
                            isDark ? "border-gray-600" : "border-slate-300"
                          }`}>
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentTopic.table.map((row, index) => (
                          <tr key={index} className={
                            index % 2 === 0 
                              ? isDark ? "bg-gray-800" : "bg-white" 
                              : isDark ? "bg-gray-700" : "bg-slate-50"
                          }>
                            <td className={`border px-4 py-2 font-medium ${
                              isDark ? "border-gray-600" : "border-slate-300"
                            }`}>
                              {row.year}
                            </td>
                            <td className={`border px-4 py-2 ${
                              isDark ? "border-gray-600" : "border-slate-300"
                            }`}>
                              {row.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className={`text-sm font-light mt-6 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}>
                  {currentTopic.note}
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { 
          display: none; 
        }
        .no-scrollbar { 
          -ms-overflow-style: none; 
          scrollbar-width: none; 
        }
      `}</style>
    </div>
  );
}