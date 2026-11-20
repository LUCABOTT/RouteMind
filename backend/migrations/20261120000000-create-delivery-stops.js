'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(
        'paradas_recorrido',
        'paradas_recorrido_una_abierta_por_recorrido',
        { transaction },
      );
      await queryInterface.changeColumn(
        'paradas_recorrido',
        'llegada_en',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addIndex('paradas_recorrido', ['recorrido_id'], {
        unique: true,
        where: {
          salida_en: null,
          pedido_id: null,
        },
        name: 'paradas_recorrido_una_abierta_por_recorrido',
        transaction,
      });
      await queryInterface.sequelize.query(
        `INSERT INTO "paradas_recorrido"
          ("recorrido_id", "pedido_id", "latitud", "longitud",
           "llegada_en", "salida_en", "created_at", "updated_at")
         SELECT p."recorrido_id", p."id", p."latitud", p."longitud",
                NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
         FROM "pedidos" p
         WHERE p."recorrido_id" IS NOT NULL
           AND NOT EXISTS (
             SELECT 1
             FROM "paradas_recorrido" pr
             WHERE pr."recorrido_id" = p."recorrido_id"
               AND pr."pedido_id" = p."id"
           )`,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `UPDATE "paradas_recorrido"
         SET "llegada_en" = COALESCE("llegada_en", "created_at"),
             "salida_en" = COALESCE("salida_en", "created_at")
         WHERE "pedido_id" IS NOT NULL`,
        { transaction },
      );
      await queryInterface.removeIndex(
        'paradas_recorrido',
        'paradas_recorrido_una_abierta_por_recorrido',
        { transaction },
      );
      await queryInterface.changeColumn(
        'paradas_recorrido',
        'llegada_en',
        {
          type: Sequelize.DATE,
          allowNull: false,
        },
        { transaction },
      );
      await queryInterface.addIndex('paradas_recorrido', ['recorrido_id'], {
        unique: true,
        where: { salida_en: null },
        name: 'paradas_recorrido_una_abierta_por_recorrido',
        transaction,
      });
    });
  },
};
