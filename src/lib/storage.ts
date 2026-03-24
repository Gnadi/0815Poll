import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

/**
 * Upload an image file to Firebase Storage and return its download URL.
 * Uses uploadBytesResumable so permission/network errors surface immediately
 * rather than hanging silently like uploadBytes can under bad rules/CORS.
 */
export function uploadPollImage(
  file: File,
  pollId: string,
  optionId: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, `polls/${pollId}/options/${optionId}`)
    const task = uploadBytesResumable(storageRef, file)

    task.on(
      'state_changed',
      null,
      (error) => reject(error),
      async () => {
        try {
          resolve(await getDownloadURL(task.snapshot.ref))
        } catch (err) {
          reject(err)
        }
      }
    )
  })
}
