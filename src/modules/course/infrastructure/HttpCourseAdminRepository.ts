import { Course, CourseDetailsInput } from '../domain/Course';
import { CourseAdminRepository } from '../domain/CourseAdminRepository';
import { MaterialInput } from '../domain/Material';

async function request(path: string, init?: RequestInit): Promise<Course> {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error ?? `Request to ${path} failed`);
  }
  return Course.fromPrimitive(body.course);
}

export class HttpCourseAdminRepository implements CourseAdminRepository {
  async createCourse(details: CourseDetailsInput): Promise<Course> {
    return await request('/api/courses', { method: 'POST', body: JSON.stringify(details) });
  }

  async updateCourseDetails(id: string, details: CourseDetailsInput): Promise<Course> {
    return await request(`/api/courses/${id}`, { method: 'PUT', body: JSON.stringify(details) });
  }

  async deleteCourse(id: string): Promise<void> {
    const response = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const body = await response.json();
      throw new Error(body.error ?? 'Delete failed');
    }
  }

  async publishCourse(id: string): Promise<Course> {
    return await request(`/api/courses/${id}/publish`, { method: 'POST' });
  }

  async unpublishCourse(id: string): Promise<Course> {
    return await request(`/api/courses/${id}/publish`, { method: 'DELETE' });
  }

  async addSection(courseId: string, title: string): Promise<Course> {
    return await request(`/api/courses/${courseId}/sections`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async updateSectionTitle(courseId: string, sectionId: string, title: string): Promise<Course> {
    return await request(`/api/courses/${courseId}/sections/${sectionId}`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    });
  }

  async removeSection(courseId: string, sectionId: string): Promise<Course> {
    return await request(`/api/courses/${courseId}/sections/${sectionId}`, { method: 'DELETE' });
  }

  async moveSection(courseId: string, sectionId: string, newIndex: number): Promise<Course> {
    return await request(`/api/courses/${courseId}/sections/${sectionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ newIndex }),
    });
  }

  async addMaterial(courseId: string, sectionId: string, material: MaterialInput): Promise<Course> {
    return await request(`/api/courses/${courseId}/sections/${sectionId}/materials`, {
      method: 'POST',
      body: JSON.stringify(material),
    });
  }

  async updateMaterial(
    courseId: string,
    sectionId: string,
    materialId: string,
    material: MaterialInput
  ): Promise<Course> {
    return await request(`/api/courses/${courseId}/sections/${sectionId}/materials/${materialId}`, {
      method: 'PUT',
      body: JSON.stringify(material),
    });
  }

  async removeMaterial(courseId: string, sectionId: string, materialId: string): Promise<Course> {
    return await request(`/api/courses/${courseId}/sections/${sectionId}/materials/${materialId}`, {
      method: 'DELETE',
    });
  }

  async moveMaterial(
    courseId: string,
    sectionId: string,
    materialId: string,
    newIndex: number
  ): Promise<Course> {
    return await request(`/api/courses/${courseId}/sections/${sectionId}/materials/${materialId}`, {
      method: 'PATCH',
      body: JSON.stringify({ newIndex }),
    });
  }

  async uploadMedia(kind: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('kind', kind);
    formData.append('file', file);
    const response = await fetch('/api/media', { method: 'POST', body: formData });
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error ?? 'Upload failed');
    }
    return body.path;
  }
}
