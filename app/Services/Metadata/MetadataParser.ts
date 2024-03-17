import Setting from 'App/Models/Setting'
import { Attribute, MetadataProvenance, ContractMetadata, TokenMetadata } from './MetadataTypes'
import Opepen from 'App/Models/Opepen'

/**
 * A class for parsing metadata and metadata provenance.
 */
export default class MetadataParser {
  metadata: MetadataProvenance
  baseData: TokenMetadata

  /**
   * Get the contract metadata
   *
   * @returns {Promise} A promise that resolves to the contract metadata
   */
  public async contract (): Promise<ContractMetadata> {
    const setting = await Setting.findByOrFail('key', 'metadata:contract')

    return setting.data
  }

  /**
   * Get the base token metadata
   *
   * @returns {Promise} A promise that resolves to the base metadata
   */
  public async base (): Promise<TokenMetadata> {
    if (this.baseData) return this.baseData

    const setting = await Setting.findByOrFail('key', 'metadata:base')

    return setting.data as TokenMetadata
  }

  /**
   * Get the metadata for a specified tokenID
   *
   * @param {String|Number} id The ID of the token to provide metadata for
   * @returns {Promise} A promise that resolves to the metadata for the specified ID
   */
  public async forId (id: string|number): Promise<TokenMetadata> {
    const opepen = await Opepen.findOrFail(id)
    const isRevealed = !! opepen.revealedAt

    const definition = isRevealed
      ? opepen.metadata
      : (await Setting.findByOrFail('key', 'metadata:editions')).data[opepen.data.edition]

    return {
      name:       `${await this.getAttribute('name',          definition)} ${id}`,
      description:   await this.getAttribute('description',   definition) as string,
      image:         await this.getAttribute('image',         definition) as string,
      image_dark:    await this.getAttribute('image_dark',    definition) as string,
      animation_url: await this.getAttribute('animation_url', definition) as string,
      embed_url:     await this.getAttribute('embed_url',     definition) as string,
      download_url:  await this.getAttribute('download_url',  definition) as string,
      attributes: [
        ...(await this.getAttribute('attributes', definition)) as Attribute[],
        {
          trait_type: 'Revealed',
          value: isRevealed ? 'Yes' : 'No',
        },
        {
          trait_type: 'Number',
          value: parseInt(`${id}`),
        }
      ],
    }
  }

  async getAttribute (attribute: keyof TokenMetadata, bag: TokenMetadata) {
    if (bag[attribute]) return bag[attribute]

    return (await this.base())[attribute]
  }

}
