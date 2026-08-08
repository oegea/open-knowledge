'use client';

import { FormEvent, useState } from 'react';
import { Course, CoursePrimitive } from '@/modules/course/domain/Course';
import { MaterialInput, MaterialPrimitive } from '@/modules/course/domain/Material';
import { SectionPrimitive } from '@/modules/course/domain/Section';
import { HttpCourseAdminRepository } from '@/modules/course/infrastructure/HttpCourseAdminRepository';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '../ui/Button';
import { MaterialForm } from './MaterialForm';
import styles from './StructureEditor.module.css';

interface StructureEditorProps {
  course: CoursePrimitive;
  onCourseChange: (course: CoursePrimitive) => void;
  onError: (message: string | null) => void;
}

const TYPE_ICONS: Record<MaterialPrimitive['type'], string> = {
  markdown: '¶',
  audio: '♪',
  video: '▶',
  exam: '?',
};

export function StructureEditor({ course, onCourseChange, onError }: StructureEditorProps) {
  const { t } = useI18n();
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [editingMaterial, setEditingMaterial] = useState<{
    sectionId: string;
    materialId: string | null;
  } | null>(null);
  const repository = new HttpCourseAdminRepository();

  const run = async (action: () => Promise<Course>) => {
    try {
      onCourseChange((await action()).toPrimitive());
      onError(null);
      return true;
    } catch (error) {
      onError(error instanceof Error ? error.message : t('common.error'));
      return false;
    }
  };

  const handleAddSection = async (event: FormEvent) => {
    event.preventDefault();
    if (newSectionTitle.trim() === '') return;
    const added = await run(() => repository.addSection(course.id!, newSectionTitle));
    if (added) setNewSectionTitle('');
  };

  const handleMaterialSubmit = async (
    sectionId: string,
    materialId: string | null,
    material: MaterialInput
  ) => {
    const saved = materialId
      ? await run(() => repository.updateMaterial(course.id!, sectionId, materialId, material))
      : await run(() => repository.addMaterial(course.id!, sectionId, material));
    if (saved) setEditingMaterial(null);
  };

  const confirmAnd = async (action: () => Promise<Course>) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    await run(action);
  };

  return (
    <div className={styles.structure}>
      {course.sections.length === 0 ? (
        <p className={`ok-glass ${styles.empty}`}>{t('admin.sectionsEmpty')}</p>
      ) : null}

      {course.sections.map((section: SectionPrimitive, sectionIndex: number) => (
        <section key={section.id} className={`ok-glass ${styles.section}`}>
          <header className={styles.sectionHeader}>
            <input
              className={styles.sectionTitle}
              value={section.title}
              aria-label={t('admin.sectionTitle')}
              onChange={(event) => {
                const sections = course.sections.map((candidate) =>
                  candidate.id === section.id
                    ? { ...candidate, title: event.target.value }
                    : candidate
                );
                onCourseChange({ ...course, sections });
              }}
              onBlur={(event) => {
                if (event.target.value.trim() !== '') {
                  run(() =>
                    repository.updateSectionTitle(course.id!, section.id, event.target.value)
                  );
                }
              }}
            />
            <div className={styles.sectionActions}>
              <Button
                variant="ghost"
                size="sm"
                aria-label={t('common.moveUp')}
                disabled={sectionIndex === 0}
                onClick={() =>
                  run(() => repository.moveSection(course.id!, section.id, sectionIndex - 1))
                }
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={t('common.moveDown')}
                disabled={sectionIndex === course.sections.length - 1}
                onClick={() =>
                  run(() => repository.moveSection(course.id!, section.id, sectionIndex + 1))
                }
              >
                ↓
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => confirmAnd(() => repository.removeSection(course.id!, section.id))}
              >
                {t('common.delete')}
              </Button>
            </div>
          </header>

          <ul className={styles.materials}>
            {section.materials.map((material, materialIndex) => (
              <li key={material.id} className={styles.material}>
                <div className={styles.materialRow}>
                  <span className={styles.materialIcon} aria-hidden="true">
                    {TYPE_ICONS[material.type]}
                  </span>
                  <span className={styles.materialInfo}>
                    <span className={styles.materialTitle}>{material.title}</span>
                    <span className={styles.materialMeta}>
                      {t(`material.type.${material.type}`)}
                      {material.required ? ` · ${t('admin.required')}` : ''}
                    </span>
                  </span>
                  <div className={styles.materialActions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={t('common.moveUp')}
                      disabled={materialIndex === 0}
                      onClick={() =>
                        run(() =>
                          repository.moveMaterial(
                            course.id!,
                            section.id,
                            material.id,
                            materialIndex - 1
                          )
                        )
                      }
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={t('common.moveDown')}
                      disabled={materialIndex === section.materials.length - 1}
                      onClick={() =>
                        run(() =>
                          repository.moveMaterial(
                            course.id!,
                            section.id,
                            material.id,
                            materialIndex + 1
                          )
                        )
                      }
                    >
                      ↓
                    </Button>
                    <Button
                      variant="soft"
                      size="sm"
                      onClick={() =>
                        setEditingMaterial({ sectionId: section.id, materialId: material.id })
                      }
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        confirmAnd(() =>
                          repository.removeMaterial(course.id!, section.id, material.id)
                        )
                      }
                    >
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>

                {editingMaterial?.sectionId === section.id &&
                editingMaterial.materialId === material.id ? (
                  <MaterialForm
                    initial={material}
                    onSubmit={(input) => handleMaterialSubmit(section.id, material.id, input)}
                    onCancel={() => setEditingMaterial(null)}
                  />
                ) : null}
              </li>
            ))}
          </ul>

          {editingMaterial?.sectionId === section.id && editingMaterial.materialId === null ? (
            <MaterialForm
              onSubmit={(input) => handleMaterialSubmit(section.id, null, input)}
              onCancel={() => setEditingMaterial(null)}
            />
          ) : (
            <Button
              variant="soft"
              size="sm"
              onClick={() => setEditingMaterial({ sectionId: section.id, materialId: null })}
            >
              + {t('admin.addMaterial')}
            </Button>
          )}
        </section>
      ))}

      <form className={`ok-glass ${styles.addSection}`} onSubmit={handleAddSection}>
        <input
          className={styles.addSectionInput}
          placeholder={t('admin.sectionTitle')}
          aria-label={t('admin.sectionTitle')}
          value={newSectionTitle}
          onChange={(event) => setNewSectionTitle(event.target.value)}
          maxLength={200}
        />
        <Button type="submit" size="sm" disabled={newSectionTitle.trim() === ''}>
          + {t('admin.addSection')}
        </Button>
      </form>
    </div>
  );
}
